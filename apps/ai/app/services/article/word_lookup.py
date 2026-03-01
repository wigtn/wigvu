"""Word/phrase lookup service"""

import json
import structlog

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode
from app.services.shared.llm_service import BaseLLMService, LLMConfig
from app.prompts.word_lookup import SYSTEM_PROMPT

logger = structlog.get_logger()


async def lookup_word(
    word: str,
    sentence: str,
) -> dict:
    """Look up a word or phrase with context from the sentence."""
    settings = get_settings()

    llm = BaseLLMService(
        default_config=LLMConfig(
            model=settings.openai_model,
            temperature=settings.llm_temperature_parsing,
            timeout=15,
            max_retries=settings.retry_max_attempts,
        )
    )

    user_content = f"조회할 단어/구문: {word}\n포함된 문장: {sentence}"

    logger.info("word_lookup_start", word=word, sentence_length=len(sentence))

    try:
        result = llm.complete_json(
            system_prompt=SYSTEM_PROMPT,
            user_content=user_content,
        )

        logger.info("word_lookup_complete", word=word)

        return {
            "word": result.get("word", word),
            "pronunciation": result.get("pronunciation"),
            "meanings": result.get("meanings", []),
            "contextMeaning": result.get("contextMeaning", ""),
            "examples": result.get("examples", []),
        }

    except json.JSONDecodeError as e:
        logger.error("word_lookup_json_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="단어 조회 결과를 파싱할 수 없습니다",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("word_lookup_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message=f"단어 조회에 실패했습니다: {str(e)}",
            status_code=500,
        )
