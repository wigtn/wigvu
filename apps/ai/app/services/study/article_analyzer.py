"""Korean article analysis service — translation + expression extraction"""

import json
import time
import structlog

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode
from app.services.shared.llm_service import BaseLLMService, LLMConfig
from app.prompts.study_analysis import get_study_system_prompt, TASK_PROMPT

logger = structlog.get_logger()


async def analyze_article(
    text: str,
    target_language: str = "en",
    title: str | None = None,
) -> dict:
    """Analyze a Korean article: split sentences, translate, extract expressions."""
    start_time = time.time()
    settings = get_settings()

    llm = BaseLLMService(
        default_config=LLMConfig(
            model=settings.openai_model,
            temperature=settings.llm_temperature_article,
            timeout=30,
            max_retries=settings.retry_max_attempts,
        )
    )

    system_prompt = get_study_system_prompt(target_language)
    user_content = f"Target language: {target_language}\n\n"
    if title:
        user_content += f"Title: {title}\n\n"
    user_content += f"Article:\n{text}"

    try:
        result = llm.complete_json(
            system_prompt=system_prompt + "\n\n" + TASK_PROMPT,
            user_content=user_content,
        )

        sentences = result.get("sentences", [])
        expressions = result.get("expressions", [])

        processing_time = (time.time() - start_time) * 1000

        return {
            "sentences": sentences,
            "expressions": expressions,
            "meta": {
                "sentenceCount": len(sentences),
                "expressionCount": len(expressions),
                "targetLanguage": target_language,
                "processingTime": round(processing_time, 1),
            },
        }

    except json.JSONDecodeError as e:
        logger.error("openai_response_parse_failed", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="Failed to parse analysis result",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("article_analysis_failed", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="Article analysis failed",
            status_code=500,
        )
