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

    def _format_seconds(self, seconds: float) -> str:
        """Convert seconds to MM:SS format"""
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}:{secs:02d}"

    def _format_transcript(
        self,
        transcript: str | None,
        segments: list[STTSegment] | None
    ) -> tuple[str | None, bool]:
        """Format transcript with timestamps if segments available"""
        if segments and len(segments) > 0:
            formatted = "\n".join(
                f"[{self._format_seconds(seg.start)}] {seg.text}"
                for seg in segments
            )
            return formatted, True
        return transcript, False

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

        system_prompt = """당신은 YouTube 영상 분석 전문가입니다. 영상의 내용을 분석하여 다음 정보를 JSON 형식으로 제공해주세요:

1. summary: 영상 내용을 3문장으로 요약 (각 문장은 50자 이내)
2. watchScore: 시청 가치 점수 (1-10, 정수)
3. watchScoreReason: 점수 근거 (50자 이내)
4. keywords: 핵심 키워드 배열 (5-10개)
5. highlights: 핵심 구간 배열 (최대 5개, 각각 timestamp(초), title(20자이내), description(50자이내))"""

        if has_timestamps:
            system_prompt += """

주의: 자막에 [MM:SS] 형식의 타임스탬프가 있습니다. highlights의 timestamp는 반드시 자막의 실제 타임스탬프를 참고하여 정확한 초 단위로 입력하세요."""

        system_prompt += "\n\nJSON만 반환하세요. 다른 텍스트는 포함하지 마세요."

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

        logger.info(
            "llm_analysis_complete",
            watch_score=result.get("watchScore"),
            keywords_count=len(result.get("keywords", [])),
            highlights_count=len(result.get("highlights", []))
        )

        return AnalysisResult(
            summary=result.get("summary", "요약을 생성할 수 없습니다."),
            watchScore=min(10, max(1, result.get("watchScore", 5))),
            watchScoreReason=result.get("watchScoreReason", "분석 정보가 부족합니다."),
            keywords=result.get("keywords", []),
            highlights=[
                Highlight(**h) for h in result.get("highlights", [])
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
