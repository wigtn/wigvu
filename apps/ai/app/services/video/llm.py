"""OpenAI LLM Service for video analysis"""

import json
import structlog
from openai import APIError, APIConnectionError, RateLimitError as OpenAIRateLimitError

from app.config import get_settings
from app.models import VideoMetadata, STTSegment, AnalysisResult, Highlight
from app.core.exceptions import LLMError
from app.services.shared.llm_service import BaseLLMService, LLMConfig
from app.prompts.video_analysis import get_video_system_prompt

logger = structlog.get_logger()


class LLMService:
    """OpenAI-based video analysis service"""

    def __init__(self):
        settings = get_settings()
        self._llm = BaseLLMService(
            default_config=LLMConfig(
                model=settings.openai_model,
                temperature=settings.llm_temperature_video,
                timeout=settings.timeout_analyze,
                max_retries=settings.retry_max_attempts,
            )
        )
        self.model = settings.openai_model
        self.timeout = settings.timeout_analyze
        self.retry_max_attempts = settings.retry_max_attempts
        self.retry_base_delay = settings.retry_base_delay

    def _format_transcript(
        self,
        transcript: str | None,
        segments: list[STTSegment] | None
    ) -> tuple[str | None, bool]:
        """Format transcript with timestamps if segments available"""
        if segments and len(segments) > 0:
            # [N초] 형식 사용 - LLM이 이해하기 쉬움
            formatted = "\n".join(
                f"[{int(seg.start)}초] {seg.text}"
                for seg in segments
            )
            return formatted, True
        return transcript, False

    def _validate_highlights(
        self,
        highlights: list[dict],
        segments: list[STTSegment] | None
    ) -> list[dict]:
        """Validate and correct highlight timestamps against actual segments"""
        if not segments or len(segments) == 0 or len(highlights) == 0:
            return highlights

        # 영상 길이 계산 (마지막 세그먼트의 end 값 기준)
        video_duration = segments[-1].end
        first_segment_start = segments[0].start

        logger.info(
            "timestamp_validation_start",
            video_duration=video_duration,
            first_segment_start=first_segment_start,
            last_segment_end=video_duration,
            segments_count=len(segments),
            highlights_count=len(highlights),
            raw_timestamps=[h.get("timestamp") for h in highlights]
        )

        validated = []
        for idx, h in enumerate(highlights):
            timestamp = h.get("timestamp", 0)
            original_timestamp = timestamp
            correction_reason = None

            # 1. 영상 길이 초과 검증
            if timestamp > video_duration:
                correction_reason = "exceeds_duration"
                logger.warning(
                    "timestamp_exceeds_duration",
                    highlight_index=idx,
                    timestamp=timestamp,
                    video_duration=video_duration,
                    excess_seconds=timestamp - video_duration,
                    title=h.get("title")
                )
                # 마지막 세그먼트의 시작 시간으로 보정
                timestamp = int(segments[-1].start)

            # 2. 음수 또는 첫 세그먼트 이전 검증
            elif timestamp < first_segment_start:
                correction_reason = "before_first_segment"
                logger.warning(
                    "timestamp_before_start",
                    highlight_index=idx,
                    timestamp=timestamp,
                    first_segment_start=first_segment_start,
                    title=h.get("title")
                )
                timestamp = int(first_segment_start)

            # 3. 가장 가까운 실제 세그먼트 타임스탬프 찾기
            closest = min(segments, key=lambda seg: abs(seg.start - timestamp))

            # 10초 이상 차이나면 가장 가까운 타임스탬프로 보정
            if abs(closest.start - timestamp) > 10:
                if not correction_reason:
                    correction_reason = "segment_mismatch"
                corrected_timestamp = int(closest.start)
                logger.info(
                    "timestamp_corrected",
                    highlight_index=idx,
                    original=original_timestamp,
                    after_bounds_check=timestamp,
                    corrected=corrected_timestamp,
                    closest_segment_start=closest.start,
                    reason=correction_reason
                )
            else:
                corrected_timestamp = timestamp
                if correction_reason:
                    logger.info(
                        "timestamp_corrected",
                        highlight_index=idx,
                        original=original_timestamp,
                        corrected=corrected_timestamp,
                        reason=correction_reason
                    )

            validated.append({
                **h,
                "timestamp": corrected_timestamp
            })

        # 검증 완료 로그
        logger.info(
            "timestamp_validation_complete",
            video_duration=video_duration,
            original_timestamps=[h.get("timestamp") for h in highlights],
            validated_timestamps=[h.get("timestamp") for h in validated],
            corrections_made=sum(
                1 for orig, val in zip(highlights, validated)
                if orig.get("timestamp") != val.get("timestamp")
            )
        )

        return validated

    async def analyze(
        self,
        metadata: VideoMetadata,
        transcript: str | None = None,
        segments: list[STTSegment] | None = None
    ) -> AnalysisResult:
        """
        Analyze video content using LLM

        Args:
            metadata: Video metadata (title, channel, description)
            transcript: Full transcript text
            segments: Timestamped segments

        Returns:
            AnalysisResult with summary, score, keywords, highlights

        Raises:
            LLMError: If OpenAI API call fails
        """
        formatted_transcript, has_timestamps = self._format_transcript(
            transcript, segments
        )

        if formatted_transcript:
            content = f"""영상 제목: {metadata.title}
채널: {metadata.channel_name}
설명: {metadata.description[:500] if metadata.description else ""}

자막 내용 (타임스탬프 포함):
{formatted_transcript}"""
        else:
            content = f"""영상 제목: {metadata.title}
채널: {metadata.channel_name}
설명: {metadata.description}

(자막이 없어 메타데이터만으로 분석합니다)"""

        system_prompt = get_video_system_prompt(has_timestamps)

        # 세그먼트 시간 범위 로그
        if segments and len(segments) > 0:
            logger.info(
                "llm_analysis_start",
                model=self.model,
                has_transcript=bool(formatted_transcript),
                has_timestamps=has_timestamps,
                title_length=len(metadata.title),
                segments_count=len(segments),
                first_segment_start=segments[0].start,
                last_segment_end=segments[-1].end
            )
            # 포맷된 트랜스크립트 샘플 (DEBUG)
            logger.debug(
                "llm_formatted_transcript_sample",
                first_500_chars=formatted_transcript[:500] if formatted_transcript else None,
                last_500_chars=formatted_transcript[-500:] if formatted_transcript and len(formatted_transcript) > 500 else None
            )
        else:
            logger.info(
                "llm_analysis_start",
                model=self.model,
                has_transcript=bool(formatted_transcript),
                has_timestamps=has_timestamps,
                title_length=len(metadata.title)
            )

        try:
            result = self._llm.complete_json(system_prompt, content)
        except OpenAIRateLimitError as e:
            logger.error("llm_rate_limit", error=str(e))
            raise LLMError(
                message="OpenAI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                details={"retry_after": 60}
            )
        except APIConnectionError as e:
            logger.error("llm_connection_error", error=str(e))
            raise LLMError(
                message="OpenAI API에 연결할 수 없습니다",
                unavailable=True,
                details={"error": str(e)}
            )
        except APIError as e:
            logger.error("llm_api_error", error=str(e), status_code=getattr(e, "status_code", None))
            raise LLMError(
                message="OpenAI API 호출에 실패했습니다",
                details={"error": str(e)}
            )
        except json.JSONDecodeError as e:
            logger.error("llm_json_parse_error", error=str(e))
            raise LLMError(
                message="AI 응답을 파싱할 수 없습니다",
                details={"error": str(e)}
            )

        # 타임스탬프 검증 및 보정
        raw_highlights = result.get("highlights", [])

        # LLM 원본 응답 로그 (DEBUG)
        logger.debug(
            "llm_raw_response",
            raw_highlights=[
                {"timestamp": h.get("timestamp"), "title": h.get("title")}
                for h in raw_highlights
            ]
        )

        validated_highlights = self._validate_highlights(raw_highlights, segments)

        # 보정 전후 비교 로그
        logger.info(
            "llm_analysis_complete",
            watch_score=result.get("watchScore"),
            keywords_count=len(result.get("keywords", [])),
            highlights_count=len(validated_highlights),
            raw_timestamps=[h.get("timestamp") for h in raw_highlights],
            validated_timestamps=[h.get("timestamp") for h in validated_highlights]
        )

        return AnalysisResult(
            summary=result.get("summary", "요약을 생성할 수 없습니다."),
            watchScore=min(10, max(1, result.get("watchScore", 5))),
            watchScoreReason=result.get("watchScoreReason", "분석 정보가 부족합니다."),
            keywords=result.get("keywords", []),
            highlights=[
                Highlight(**h) for h in validated_highlights
            ]
        )
