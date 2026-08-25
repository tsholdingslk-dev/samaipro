"""
SAM AI - Image Generation Provider Adapter
Supports DALL-E, Stable Diffusion (HuggingFace), Midjourney API, and more.
"""

import time
import base64
from typing import Dict, Any, List, Optional
from providers.base import ProviderAdapter, ProviderCapabilities, ProviderType, ProviderResponse


class ImageGenerationAdapter(ProviderAdapter):
    def _define_capabilities(self) -> ProviderCapabilities:
        model = (self.model or "").lower()
        caps = ProviderCapabilities(
            image_generation=True,
            max_tokens=4000,
        )
        if "dall" in model or "openai" in self.name.lower():
            caps.image_generation = True
        if "stable" in model or "sd" in model:
            caps.image_generation = True
        if "midjourney" in model:
            caps.image_generation = True
        return caps

    def _init_client(self):
        self.provider_kind = self._kwargs.get("kind", "openai_image")
        if self.provider_kind == "huggingface":
            self.hf_endpoint = self._kwargs.get("hf_endpoint", "https://api-inference.huggingface.co/models")
        elif self.provider_kind == "midjourney":
            pass

    def _is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

    async def generate_image(self, prompt: str, **kwargs) -> Optional[str]:
        start = time.time()
        try:
            if self.provider_kind == "openai_image":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=self.api_key)
                response = await client.images.generate(
                    model=kwargs.get("model", "dall-e-3"),
                    prompt=prompt,
                    n=1,
                    size=kwargs.get("size", "1024x1024"),
                    response_format=kwargs.get("response_format", "url"),
                    quality=kwargs.get("quality", "standard"),
                )
                if response.data and response.data[0].url:
                    latency = time.time() - start
                    return response.data[0].url
                return None

            elif self.provider_kind == "huggingface":
                import aiohttp
                model_id = kwargs.get("model", self.model or "runwayml/stable-diffusion-v1-5")
                url = f"{self.hf_endpoint}/{model_id}"
                headers = {"Authorization": f"Bearer {self.api_key}"}
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "num_inference_steps": kwargs.get("steps", 30),
                        "width": kwargs.get("width", 512),
                        "height": kwargs.get("height", 512),
                        "guidance_scale": kwargs.get("guidance_scale", 7.5),
                    },
                }
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload, headers=headers, timeout=120) as resp:
                        if resp.status == 200:
                            content_type = resp.headers.get("content-type", "")
                            if "image" in content_type:
                                img_bytes = await resp.read()
                                encoded = base64.b64encode(img_bytes).decode()
                                return f"data:image/png;base64,{encoded}"
                            else:
                                data = await resp.json()
                                return data.get("image", None)
                        else:
                            text = await resp.text()
                            raise Exception(f"HF error {resp.status}: {text[:200]}")
                return None

            elif self.provider_kind == "midjourney":
                import aiohttp
                url = "https://api.midjourney.io/v1/imagine"
                headers = {"Authorization": f"Bearer {self.api_key}"}
                payload = {
                    "prompt": prompt,
                    "model": kwargs.get("model", "midjourney-v6"),
                    "width": kwargs.get("width", 1024),
                    "height": kwargs.get("height", 1024),
                    "quality": kwargs.get("quality", "standard"),
                    "style": kwargs.get("style", "raw"),
                }
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload, headers=headers, timeout=120) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            return data.get("image_url", None)
                        else:
                            text = await resp.text()
                            raise Exception(f"Midjourney error {resp.status}: {text[:200]}")
                return None

            else:
                raise ValueError(f"Unknown image provider: {self.provider_kind}")

        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def analyze_image(self, image_data: str, prompt: str, **kwargs) -> Optional[str]:
        from providers.openai_adapter import OpenAIAdapter
        if not self.capabilities.image_analysis:
            raise NotImplementedError("This image provider does not support analysis")
        return None

    async def chat(self, messages: List[Dict[str, Any]], model: Optional[str] = None, **kwargs) -> ProviderResponse:
        raise NotImplementedError("Image Generation adapter does not support chat")
