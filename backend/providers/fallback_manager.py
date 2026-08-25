"""
SAM AI - Fallback Manager
Orchestrates automatic fallback between providers when the primary fails,
including retry with exponential backoff and provider cooldown.
"""

import asyncio
import time
from typing import Dict, Any, List, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class FallbackResult:
    provider_name: str
    success: bool
    content: Optional[str] = None
    response: Optional[Any] = None
    error: Optional[str] = None
    attempts: int = 0
    total_latency_ms: float = 0.0


class FallbackManager:
    def __init__(self, max_retries: int = 2, backoff_base: float = 1.0, backoff_max: float = 10.0):
        self.max_retries = max_retries
        self.backoff_base = backoff_base
        self.backoff_max = backoff_max
        self.provider_failure_counts: Dict[str, int] = {}
        self.provider_cooldowns: Dict[str, datetime] = {}
        self.cooldown_duration = timedelta(minutes=3)

    def _is_in_cooldown(self, provider_name: str) -> bool:
        if provider_name not in self.provider_cooldowns:
            return False
        return self.provider_cooldowns[provider_name] > datetime.utcnow()

    def _record_failure(self, provider_name: str):
        self.provider_failure_counts[provider_name] = self.provider_failure_counts.get(provider_name, 0) + 1
        if self.provider_failure_counts[provider_name] >= self.frequent_failure_threshold:
            self.provider_cooldowns[provider_name] = datetime.utcnow() + self.cooldown_duration

    frequent_failure_threshold = 3

    def _record_success(self, provider_name: str):
        self.provider_failure_counts[provider_name] = 0
        if provider_name in self.provider_cooldowns:
            del self.provider_cooldowns[provider_name]

    def reset_provider(self, provider_name: str):
        self.provider_failure_counts.pop(provider_name, None)
        self.provider_cooldowns.pop(provider_name, None)

    def reset_all(self):
        self.provider_failure_counts.clear()
        self.provider_cooldowns.clear()

    def _get_backoff(self, attempt: int) -> float:
        delay = self.backoff_base * (2 ** (attempt - 1))
        return min(delay, self.backoff_max)

    async def execute_with_fallback(
        self,
        providers: List[Any],
        operation: Callable,
        operation_name: str = "chat",
        **kwargs
    ) -> FallbackResult:
        if not providers:
            return FallbackResult(
                provider_name="none",
                success=False,
                error="No providers available"
            )

        errors = []
        total_start = time.time()
        attempts = 0

        for idx, provider in enumerate(providers):
            if self._is_in_cooldown(provider.name):
                errors.append(f"{provider.name}: in cooldown")
                continue

            for attempt in range(self.max_retries + 1):
                attempts += 1
                try:
                    result = await operation(provider, attempt=attempt, **kwargs)

                    if isinstance(result, dict):
                        if result.get("success", True):
                            self._record_success(provider.name)
                            return FallbackResult(
                                provider_name=provider.name,
                                success=True,
                                content=result.get("content"),
                                response=result,
                                attempts=attempts,
                                total_latency_ms=round((time.time() - total_start) * 1000, 2)
                            )
                        else:
                            raise Exception(result.get("error", "Unknown error"))
                    elif result is not None:
                        self._record_success(provider.name)
                        return FallbackResult(
                            provider_name=provider.name,
                            success=True,
                            content=str(result),
                            response=result,
                            attempts=attempts,
                            total_latency_ms=round((time.time() - total_start) * 1000, 2)
                        )
                    else:
                        raise Exception("Empty response from provider")

                except Exception as e:
                    error_msg = str(e)
                    errors.append(f"{provider.name} (attempt {attempt + 1}): {str(e)[:200]}")

                    is_rate_limit = any(kw in error_msg.lower() for kw in ["rate limit", "429", "quota", "capacity"])
                    is_auth_error = any(kw in error_msg.lower() for kw in ["401", "unauthorized", "invalid", "auth"])

                    if is_rate_limit or is_auth_error:
                        self._record_failure(provider.name)
                        break
                    elif attempt < self.max_retries:
                        delay = self._get_backoff(attempt + 1)
                        await asyncio.sleep(delay)
                    elif idx < len(providers) - 1:
                        continue

        return FallbackResult(
            provider_name="all_failed",
            success=False,
            error=f"All {len(providers)} providers failed. Errors: {'; '.join(errors[-3:])}",
            attempts=attempts,
            total_latency_ms=round((time.time() - total_start) * 1000, 2)
        )

    async def execute_chat_with_fallback(
        self,
        providers: List[Any],
        messages: List[Dict[str, Any]],
        model_override: Optional[str] = None,
        **kwargs
    ) -> FallbackResult:
        async def _chat_op(provider, attempt, **op_kwargs):
            res = await provider.chat(messages, model=model_override or provider.model, **op_kwargs)
            return {
                "success": res is not None and res.content is not None,
                "content": res.content if res else None,
                "usage": res.usage if res else {},
                "latency_ms": res.latency_ms if res else 0,
                "provider": res.provider_name if res else None,
                "model": res.model if res else None,
            }

        return await self.execute_with_fallback(providers, _chat_op, operation_name="chat", **kwargs)

    async def execute_embed_with_fallback(
        self,
        providers: List[Any],
        text: str,
        model_override: Optional[str] = None,
    ) -> FallbackResult:
        async def _embed_op(provider, attempt, **op_kwargs):
            res = await provider.embed(text, model=model_override)
            if res is None:
                raise Exception("Embedding returned None")
            return {"success": True, "content": res, "embedding": res}

        return await self.execute_with_fallback(providers, _embed_op, operation_name="embed")

    async def execute_image_with_fallback(
        self,
        providers: List[Any],
        prompt: str,
        **kwargs
    ) -> FallbackResult:
        async def _img_op(provider, attempt, **op_kwargs):
            res = await provider.generate_image(prompt, **op_kwargs)
            return {"success": res is not None, "content": res}

        return await self.execute_with_fallback(providers, _img_op, operation_name="image_generation", **kwargs)

    async def execute_stt_with_fallback(
        self,
        providers: List[Any],
        audio_data: bytes,
        **kwargs
    ) -> FallbackResult:
        async def _stt_op(provider, attempt, **op_kwargs):
            res = await provider.transcribe_audio(audio_data, **op_kwargs)
            return {"success": res is not None, "content": res}

        return await self.execute_with_fallback(providers, _stt_op, operation_name="speech_to_text", **kwargs)

    async def execute_tts_with_fallback(
        self,
        providers: List[Any],
        text: str,
        **kwargs
    ) -> FallbackResult:
        async def _tts_op(provider, attempt, **op_kwargs):
            res = await provider.synthesize_speech(text, **op_kwargs)
            return {"success": res is not None, "content": res}

        return await self.execute_with_fallback(providers, _tts_op, operation_name="text_to_speech", **kwargs)


fallback_manager = FallbackManager()
