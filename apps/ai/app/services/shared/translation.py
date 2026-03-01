"""Translation service - Batch translation with OpenAI"""

import json
import logging
import asyncio
from typing import TypedDict
from openai import APIConnectionError, RateLimitError, APIStatusError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode
from app.services.shared.llm_service import BaseLLMService, LLMConfig
from app.prompts.translation import get_translation_system_prompt

logger = logging.getLogger(__name__)


class SegmentInput(TypedDict):
    start: float
    end: float
    text: str


class TranslatedSegmentOutput(TypedDict):
    start: float
    end: float
    original_text: str
    translated_text: str


def chunk_array(array: list, size: int) -> list[list]:
    """Split array into chunks of specified size"""
    return [array[i:i + size] for i in range(0, len(array), size)]


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((APIConnectionError, RateLimitError)),
    before_sleep=before_sleep_log(logger, logging.WARNING),
)
async def translate_batch(
    llm: BaseLLMService,
    segments: list[SegmentInput],
    source_language: str,
    target_language: str,
    context_text: str = "",
) -> list[str]:
    """Translate a single batch of segments"""
    segments_json = [{"id": idx, "text": seg["text"]} for idx, seg in enumerate(segments)]

    prompt = (
        f'이전 문맥: "{context_text}"\n\n번역할 자막:\n{json.dumps(segments_json, ensure_ascii=False, indent=2)}'
        if context_text
        else f'번역할 자막:\n{json.dumps(segments_json, ensure_ascii=False, indent=2)}'
    )

    system_prompt = get_translation_system_prompt(source_language, target_language)

    try:
        result = llm.complete_json(
            system_prompt=system_prompt,
            user_content=prompt,
        )

        translations = result.get("translations", [])

        # Sort by id and extract text
        return [
            next(
                (t["text"] for t in translations if t["id"] == idx),
                segments[idx]["text"]  # Fallback to original
            )
            for idx in range(len(segments))
        ]

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse translation response: {e}")
        return [seg["text"] for seg in segments]
    except (APIConnectionError, RateLimitError):
        raise
    except APIStatusError as e:
        logger.error(f"OpenAI API error: {e}")
        return [seg["text"] for seg in segments]


async def translate_segments(
    segments: list[SegmentInput],
    source_language: str = "en",
    target_language: str = "ko",
) -> list[TranslatedSegmentOutput]:
    """
    Translate all segments with batch processing.

    - Processes segments in batches for efficiency
    - Maintains context across batches
    - Concurrent batch processing
    """
    if not segments:
        return []

    logger.info(f"Starting translation: {len(segments)} segments")

    settings = get_settings()

    llm = BaseLLMService(
        default_config=LLMConfig(
            model=settings.openai_model,
            temperature=settings.llm_temperature_article,
            max_retries=settings.retry_max_attempts,
        )
    )

    batch_size = settings.translation_batch_size
    context_size = settings.translation_context_size
    concurrent_batches = settings.translation_concurrent_batches

    batches = chunk_array(segments, batch_size)
    translated_segments: list[TranslatedSegmentOutput] = []

    logger.info(f"Created {len(batches)} batches (size: {batch_size})")

    previous_context = ""

    for i in range(0, len(batches), concurrent_batches):
        concurrent_batch_group = batches[i:i + concurrent_batches]

        # Process batches concurrently
        async def process_batch(batch: list[SegmentInput], batch_idx: int) -> list[TranslatedSegmentOutput]:
            absolute_batch_idx = i + batch_idx
            context = "" if absolute_batch_idx == 0 else previous_context

            logger.debug(f"Translating batch {absolute_batch_idx + 1}/{len(batches)}")

            translations = await translate_batch(
                llm, batch, source_language, target_language, context
            )

            return [
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "original_text": seg["text"],
                    "translated_text": translations[idx],
                }
                for idx, seg in enumerate(batch)
            ]

        tasks = [
            process_batch(batch, batch_idx)
            for batch_idx, batch in enumerate(concurrent_batch_group)
        ]
        results = await asyncio.gather(*tasks)

        for batch_result in results:
            translated_segments.extend(batch_result)

        # Update context for next batch
        last_batch = concurrent_batch_group[-1]
        if last_batch:
            context_segments = last_batch[-context_size:]
            previous_context = " ".join(seg["text"] for seg in context_segments)

        logger.info(f"Batch progress: {min(i + concurrent_batches, len(batches))}/{len(batches)}")

    logger.info(f"Translation completed: {len(translated_segments)} segments")

    return translated_segments
