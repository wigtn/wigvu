"""Sentence structure parsing service"""

import json
import structlog

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode
from app.services.shared.llm_service import BaseLLMService, LLMConfig
from app.prompts.sentence_parsing import SYSTEM_PROMPT

logger = structlog.get_logger()


async def parse_sentence(
    sentence: str,
    context: str | None = None,
) -> dict:
    """Parse an English sentence into grammatical components."""
    settings = get_settings()

    llm = BaseLLMService(
        default_config=LLMConfig(
            model=settings.openai_model,
            temperature=settings.llm_temperature_parsing,
            timeout=30,
            max_retries=settings.retry_max_attempts,
        )
    )

    user_content = f"분석할 문장: {sentence}"
    if context:
        user_content += f"\n\n전후 문맥: {context}"

    logger.info("sentence_parse_start", sentence_length=len(sentence))

    try:
        result = llm.complete_json(
            system_prompt=SYSTEM_PROMPT,
            user_content=user_content,
        )

        logger.info(
            "sentence_parse_complete",
            components_count=len(result.get("components", [])),
            grammar_points_count=len(result.get("grammarPoints", [])),
        )

        return {
            "components": result.get("components", []),
            "readingOrder": result.get("readingOrder", ""),
            "grammarPoints": result.get("grammarPoints", []),
        }

    except json.JSONDecodeError as e:
        logger.error("sentence_parse_json_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="구조 분석 결과를 파싱할 수 없습니다",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("sentence_parse_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message=f"문장 구조 분석에 실패했습니다: {str(e)}",
            status_code=500,
        )
