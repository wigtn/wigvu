"""Base LLM service with shared OpenAI client and retry logic"""

import json
import logging
from dataclasses import dataclass

import structlog
from openai import OpenAI, APIConnectionError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import get_settings

logger = structlog.get_logger()


@dataclass
class LLMConfig:
    """Configuration for an LLM call"""

    model: str | None = None
    temperature: float = 0.7
    timeout: int | None = None
    max_retries: int | None = None


class BaseLLMService:
    """Wraps the OpenAI client with retry logic and JSON mode.

    All LLM-calling services should use this class to make OpenAI API calls
    instead of creating their own clients and retry decorators.
    """

    def __init__(self, default_config: LLMConfig | None = None):
        settings = get_settings()
        self._client = OpenAI(api_key=settings.openai_api_key)
        self._default_config = default_config or LLMConfig()
        # Fill in defaults from settings
        if self._default_config.model is None:
            self._default_config.model = settings.openai_model
        if self._default_config.timeout is None:
            self._default_config.timeout = settings.timeout_analyze
        if self._default_config.max_retries is None:
            self._default_config.max_retries = settings.retry_max_attempts

    @property
    def client(self) -> OpenAI:
        """Access the underlying OpenAI client (for advanced use cases)."""
        return self._client

    def _resolve_config(self, config_override: LLMConfig | None) -> LLMConfig:
        """Merge an optional override config with the default config."""
        if config_override is None:
            return self._default_config
        return LLMConfig(
            model=config_override.model or self._default_config.model,
            temperature=config_override.temperature,
            timeout=config_override.timeout if config_override.timeout is not None else self._default_config.timeout,
            max_retries=config_override.max_retries if config_override.max_retries is not None else self._default_config.max_retries,
        )

    def complete_json(
        self,
        system_prompt: str,
        user_content: str,
        config_override: LLMConfig | None = None,
    ) -> dict:
        """Call OpenAI chat completions API with JSON mode and retry logic.

        Args:
            system_prompt: The system message content.
            user_content: The user message content.
            config_override: Optional config to override defaults for this call.

        Returns:
            Parsed JSON response as a dict.

        Raises:
            OpenAIRateLimitError: If rate limited (after retries).
            APIConnectionError: If connection fails (after retries).
            APIError: If the API returns an error.
            json.JSONDecodeError: If the response cannot be parsed as JSON.
        """
        config = self._resolve_config(config_override)
        settings = get_settings()

        @retry(
            stop=stop_after_attempt(config.max_retries),
            wait=wait_exponential(
                multiplier=settings.retry_base_delay,
                min=settings.retry_base_delay,
                max=settings.retry_base_delay * 4,
            ),
            retry=retry_if_exception_type((APIConnectionError,)),
            before_sleep=before_sleep_log(logger, logging.WARNING),
            reraise=True,
        )
        def _do_request() -> dict:
            response = self._client.chat.completions.create(
                model=config.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=config.temperature,
                response_format={"type": "json_object"},
                timeout=config.timeout,
            )
            return json.loads(response.choices[0].message.content or "{}")

        return _do_request()
