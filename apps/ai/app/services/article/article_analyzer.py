"""English article analysis service — sentence translation + expression extraction"""

import json
import time
import structlog

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode
from app.services.shared.llm_service import BaseLLMService, LLMConfig
from app.prompts.article_analysis import SYSTEM_PROMPT, TASK_PROMPT

logger = structlog.get_logger()


async def analyze_article(
    text: str,
    title: str | None = None,
    source: str | None = None,
) -> dict:
    """Analyze an English article: split sentences, translate to Korean, extract expressions."""
    start_time = time.time()
    settings = get_settings()

    llm = BaseLLMService(
        default_config=LLMConfig(
            model=settings.openai_model,
            temperature=settings.llm_temperature_article,
            timeout=60,
            max_retries=settings.retry_max_attempts,
        )
    )

    user_content = ""
    if title:
        user_content += f"기사 제목: {title}\n"
    if source:
        user_content += f"출처: {source}\n"
    user_content += f"\n기사 본문:\n{text}"

    logger.info(
        "article_analyze_start",
        text_length=len(text),
        has_title=bool(title),
        has_source=bool(source),
    )

    try:
        result = llm.complete_json(
            system_prompt=SYSTEM_PROMPT,
            user_content=TASK_PROMPT + "\n\n" + user_content,
        )

        sentences = result.get("sentences", [])
        expressions = result.get("expressions", [])

        processing_time = (time.time() - start_time) * 1000

        logger.info(
            "article_analyze_complete",
            sentence_count=len(sentences),
            expression_count=len(expressions),
            processing_time=round(processing_time, 1),
        )

        return {
            "sentences": sentences,
            "expressions": expressions,
            "meta": {
                "sentenceCount": len(sentences),
                "expressionCount": len(expressions),
                "processingTime": round(processing_time, 1),
            },
        }

    except json.JSONDecodeError as e:
        logger.error("article_analyze_json_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="AI 응답을 파싱할 수 없습니다",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("article_analyze_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message=f"기사 분석에 실패했습니다: {str(e)}",
            status_code=500,
        )
