"""
SAM AI - OpenAI-compatible Provider Adapter
Supports OpenAI, Groq, OpenRouter, InferX, HuggingFace.
"""

import time
import asyncio
from typing import Dict, Any, List, Optional
from providers.base import ProviderAdapter, ProviderCapabilities, ProviderType, ProviderResponse
from openai import AsyncOpenAI, OpenAI


class OpenAIAdapter(ProviderAdapter):
    def _define_capabilities(self) -> ProviderCapabilities:
        model = (self.model or "").lower()
        caps = ProviderCapabilities(
            chat=True,
            embedding=True,
            json_mode=True,
            streaming=True,
            max_tokens=16384,
        )
        if "gpt-4o" in model or "vision" in model or "gpt-4" in model:
            caps.image_analysis = True
            caps.multimodal = True
        if "turbo" in model or "mini" in model or "flash" in model:
            caps.max_tokens = 16384
        else:
            caps.max_tokens = 128000
        if "embedding" in model or "text-embedding" in model:
            caps.chat = False
        return caps

    def _init_client(self):
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=60.0,
        ) if self.base_url else AsyncOpenAI(api_key=self.api_key, timeout=60.0)
        self._sync_client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=60.0,
        ) if self.base_url else OpenAI(api_key=self.api_key, timeout=60.0)

    def _is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        **kwargs
    ) -> ProviderResponse:
        start = time.time()
        m = model or self.model
        params = {"model": m, "messages": messages}
        params.update(kwargs)

        try:
            response = await self.client.chat.completions.create(**params)
            latency = time.time() - start
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
                content=response.choices[0].message.content,
                usage=usage,
                latency_ms=round(latency * 1000, 2),
                metadata={"finish_reason": response.choices[0].finish_reason if response.choices else None},
                raw_response=response,
            )
        except Exception as e:
            self.mark_unavailable(str(e))
            raise

    async def embed(self, text: str, model: Optional[str] = None) -> Optional[List[float]]:
        try:
            m = model or self.model or "text-embedding-3-small"
            response = await self.client.embeddings.create(model=m, input=text)
            return response.data[0].embedding
        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def generate_image(self, prompt: str, **kwargs) -> Optional[str]:
        try:
            response = await self.client.images.generate(
                model=kwargs.get("model", "dall-e-3"),
                prompt=prompt,
                n=1,
                size=kwargs.get("size", "1024x1024"),
                response_format="url"
            )
            return response.data[0].url if response.data else None
        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def analyze_image(self, image_data: str, prompt: str, **kwargs) -> Optional[str]:
        try:
            messages = [
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_data}}
                ]}
            ]
            return await self._chat_raw(messages, kwargs.get("model"))
        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def _chat_raw(self, messages: List[Dict[str, Any]], model: Optional[str] = None) -> str:
        m = model or self.model
        response = await self.client.chat.completions.create(
            model=m, messages=messages, max_tokens=4000, temperature=0.7
        )
        return response.choices[0].message.content

    async def transcribe_audio(self, audio_data: bytes, **kwargs) -> Optional[str]:
        try:
            import io
            response = await self.client.audio.transcriptions.create(
                model=kwargs.get("model", "whisper-1"),
                file=("audio.wav", io.BytesIO(audio_data), "audio/wav"),
            )
            return response.text
        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def synthesize_speech(self, text: str, voice: str = "alloy", **kwargs) -> Optional[bytes]:
        try:
            response = await self.client.audio.speech.create(
                model=kwargs.get("model", "tts-1"),
                voice=kwargs.get("voice", voice),
                input=text,
            )
            return await response.aread()
        except Exception as e:
            self.mark_unavailable(str(e))
            return None
