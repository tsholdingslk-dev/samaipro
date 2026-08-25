"""
SAM AI - Local LLM Provider Adapter
Supports Ollama, LMStudio, and other local inference servers.
"""

import time
from typing import Dict, Any, List, Optional
from providers.base import ProviderAdapter, ProviderCapabilities, ProviderType, ProviderResponse


class LocalLLMAdapter(ProviderAdapter):
    def _define_capabilities(self) -> ProviderCapabilities:
        model = (self.model or "").lower()
        return ProviderCapabilities(
            chat=True,
            embedding=True,
            json_mode=True,
            max_tokens=32000,
        )

    def _init_client(self):
        self.base_url = self._kwargs.get("base_url", "http://localhost:11434/api")
        self.provider_kind = self._kwargs.get("kind", "ollama")
        if self.provider_kind == "lmstudio":
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(
                base_url=self.base_url,
                api_key="not-needed",
                timeout=120.0,
            )
        elif self.provider_kind == "ollama":
            self.client = None

    def _is_available(self) -> bool:
        try:
            import httpx
            test_url = self.base_url.rstrip("/api").rstrip("/v1")
            if self.provider_kind == "lmstudio":
                test_url = self.base_url
            elif self.provider_kind == "ollama":
                test_url = self.base_url.rstrip("/api") + "/api/tags"

            import asyncio
            loop = asyncio.get_event_loop()

            def _check():
                with httpx.Client(timeout=5.0) as client:
                    resp = client.get(test_url)
                    return resp.status_code in (200, 401)

            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(_check).result(timeout=10)
            else:
                return loop.run_until_complete(asyncio.get_event_loop().run_in_executor(None, _check))
        except Exception:
            return False

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        **kwargs
    ) -> ProviderResponse:
        start = time.time()
        m = model or self.model or "llama3"

        if self.provider_kind == "lmstudio":
            params = {
                "model": m,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens", 4000),
            }
            response = await self.client.chat.completions.create(**params)
            latency = time.time() - start
            content = response.choices[0].message.content
            usage = {}
            if hasattr(response, 'usage') and response.usage:
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            return ProviderResponse(
                provider_name=self.name,
                provider_type=self.provider_type.value,
                model=m,
                content=content,
                usage=usage,
                latency_ms=round(latency * 1000, 2),
                raw_response=response,
            )

        elif self.provider_kind == "ollama":
            import httpx
            import asyncio
            payload = {
                "model": m,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": kwargs.get("temperature", 0.7),
                    "num_predict": kwargs.get("max_tokens", 4000),
                },
            }
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(self.base_url + "/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
                latency = time.time() - start
                content = data.get("message", {}).get("content", "")
                usage = {
                    "eval_count": data.get("eval_count", 0),
                    "eval_duration": data.get("eval_duration", 0),
                    "prompt_eval_count": data.get("prompt_eval_count", 0),
                }
                return ProviderResponse(
                    provider_name=self.name,
                    provider_type=self.provider_type.value,
                    model=m,
                    content=content,
                    usage=usage,
                    latency_ms=round(latency * 1000, 2),
                    raw_response=data,
                )

        raise ValueError(f"Unknown local provider: {self.provider_kind}")

    async def embed(self, text: str, model: Optional[str] = None) -> Optional[List[float]]:
        try:
            if self.provider_kind == "lmstudio":
                response = await self.client.embeddings.create(
                    model=model or self.model,
                    input=text,
                )
                return response.data[0].embedding
            elif self.provider_kind == "ollama":
                import httpx
                payload = {"model": model or self.model, "prompt": text}
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(self.base_url + "/embeddings", json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    return data.get("embedding")
        except Exception as e:
            self.mark_unavailable(str(e))
            return None
        return None
