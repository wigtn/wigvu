"""OpenAI LLM Service for video analysis"""

import json
import logging
import structlog
from openai import OpenAI, APIError, APIConnectionError, RateLimitError as OpenAIRateLimitError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import get_settings
from app.models import VideoMetadata, STTSegment, AnalysisResult, Highlight
from app.core.exceptions import LLMError

logger = structlog.get_logger()


class LLMService:
    """OpenAI-based video analysis service"""

    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
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

        validated = []
        for h in highlights:
            timestamp = h.get("timestamp", 0)

            # 가장 가까운 실제 세그먼트 타임스탬프 찾기
            closest = min(segments, key=lambda seg: abs(seg.start - timestamp))

            # 10초 이상 차이나면 가장 가까운 타임스탬프로 보정
            if abs(closest.start - timestamp) > 10:
                corrected_timestamp = int(closest.start)
                logger.info(
                    "timestamp_corrected",
                    original=timestamp,
                    corrected=corrected_timestamp
                )
            else:
                corrected_timestamp = timestamp

            validated.append({
                **h,
                "timestamp": corrected_timestamp
            })

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

        system_prompt = """당신은 YouTube 영상 분석 전문가입니다. 영상의 내용을 분석하여 다음 정보를 JSON 형식으로 제공해주세요.

중요: 영상이 어떤 언어든 상관없이 모든 응답(summary, keywords, highlights의 title/description)은 반드시 한국어로 작성하세요.

1. summary: 영상 내용을 3문장으로 요약 (각 문장은 50자 이내)
   - 중요: 반드시 스크립트(자막 또는 음성 인식 텍스트)를 읽고 실제 영상에서 다루는 핵심 내용을 요약하세요
   - 제목이나 설명이 아닌, 스크립트에서 말하는 구체적인 내용을 기반으로 작성하세요
2. watchScore: 시청 가치 점수 (1-10, 정수)
3. watchScoreReason: 점수 근거 (50자 이내)
4. keywords: 핵심 키워드 배열 (5-10개) - 스크립트에서 자주 언급되는 주요 개념
5. highlights: 핵심 구간 배열 (각각 timestamp(초), title(20자이내), description(50자이내))
   - 기준: 주제가 전환되는 구간을 챕터처럼 선정하세요
   - 개수는 실제 주제 전환 횟수에 맞게 자유롭게 결정하세요
   - 전환점이 2개면 2개, 7개면 7개 - 억지로 늘리거나 줄이지 마세요"""

        if has_timestamps:
            system_prompt += """

타임스탬프 규칙:
- 스크립트에 [N초] 형식으로 타임스탬프가 표시되어 있습니다 (예: [120초], [450초])
- highlights의 timestamp는 반드시 스크립트에 있는 숫자를 그대로 사용하세요
- 예: [120초]가 있으면 timestamp: 120
- 절대로 스크립트에 없는 시간을 만들어내지 마세요"""

        system_prompt += "\n\nJSON만 반환하세요. 다른 텍스트는 포함하지 마세요."

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
            result = await self._call_openai_with_retry(system_prompt, content)
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

    async def _call_openai_with_retry(
        self,
        system_prompt: str,
        content: str
    ) -> dict:
        """Call OpenAI API with retry logic"""
        settings = get_settings()

        @retry(
            stop=stop_after_attempt(settings.retry_max_attempts),
            wait=wait_exponential(
                multiplier=settings.retry_base_delay,
                min=settings.retry_base_delay,
                max=settings.retry_base_delay * 4
            ),
            retry=retry_if_exception_type((APIConnectionError,)),
            before_sleep=before_sleep_log(logger, logging.WARNING),
            reraise=True
        )
        def _do_request() -> dict:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content},
                ],
                temperature=0.7,
                response_format={"type": "json_object"},
                timeout=self.timeout
            )
            return json.loads(response.choices[0].message.content or "{}")

        return _do_request()
