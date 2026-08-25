"""
SAM AI - Gemini Provider Adapter (Direct Google API)
Uses the official google-generativeai library for chat, embeddings, and vision.
"""

import time
import json
from typing import Dict, Any, List, Optional
from providers.base import ProviderAdapter, ProviderCapabilities, ProviderType, ProviderResponse

import google.generativeai as genai


class GeminiAdapter(ProviderAdapter):
    def _define_capabilities(self) -> ProviderCapabilities:
        model = (self.model or "").lower()
        caps = ProviderCapabilities(
            chat=True,
            embedding=True,
            streaming=True,
            json_mode=True,
            max_tokens=1000000,
        )
        if "flash" in model:
            caps.max_tokens = 100000
        if "pro" in model:
            caps.max_tokens = 1000000
            caps.multimodal = True
            caps.image_analysis = True
        return caps

    def _init_client(self):
        genai.configure(api_key=self.api_key)
        self._genai = genai

    def _is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 10

    def _get_generation_config(self, kwargs: Dict) -> Dict:
        config = {
            "temperature": kwargs.get("temperature", 0.7),
            "max_output_tokens": kwargs.get("max_tokens", 2048),
            "top_p": kwargs.get("top_p", 0.95),
        }
        if kwargs.get("response_format", {}).get("type") == "json_object":
            config["response_mime_type"] = "application/json"
        return config

    def _convert_messages(self, messages: List[Dict[str, Any]]) -> str:
        history = []
        system_instruction = None
        current_contents = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_instruction = content
            elif role == "user":
                current_contents.append(content)
            elif role == "assistant":
                history.append({"role": "user", "parts": current_contents})
                history.append({"role": "model", "parts": [content]})
                current_contents = []

        if not history:
            return current_contents

        return {"history": history, "current": current_contents, "system": system_instruction}

    def _prepare_model(self, model: str) -> Any:
        m = model or self.model or "gemini-2.5-flash"
        generation_config = self._get_generation_config({})

        if generation_config.get("response_mime_type") == "application/json":
            return self._genai.GenerativeModel(m, generation_config=generation_config)

        return self._genai.GenerativeModel(m, generation_config=generation_config)

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        **kwargs
    ) -> ProviderResponse:
        import asyncio
        start = time.time()
        m = model or self.model or "gemini-2.5-flash"

        system_instruction = None
        history = []
        current_contents = []

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_instruction = content
            elif role == "user":
                if isinstance(content, str):
                    current_contents.append(content)
                elif isinstance(content, list):
                    parts = []
                    for item in content:
                        if isinstance(item, dict):
                            if item.get("type") == "text":
                                parts.append(item.get("text", ""))
                            elif item.get("type") == "image_url":
                                import base64
                                img_data = item["image_url"]["url"]
                                if img_data.startswith("data:"):
                                    img_data = img_data.split(",")[1]
                                parts.append({"image": base64.b64decode(img_data)})
                    current_contents.append(parts)
            elif role == "assistant":
                history.append({"role": "user", "parts": current_contents if current_contents else ["placeholder"]})
                history.append({"role": "model", "parts": [content]})
                current_contents = []

        generation_config = self._get_generation_config(kwargs)

        try:
            if self.capabilities.multimodal:
                gen_model = self._genai.GenerativeModel(
                    m,
                    system_instruction=system_instruction,
                    generation_config=generation_config,
                )
            else:
                gen_model = self._genai.GenerativeModel(
                    m,
                    system_instruction=system_instruction,
                    generation_config=generation_config,
                )

            prompt = current_contents[-1] if current_contents else "Hello"

            response = await asyncio.to_thread(
                lambda: gen_model.generate_content(
                    contents=prompt,
                    history=history if history else None,
                    request_options={"timeout": 60}
                )
            )

            latency = time.time() - start
            content = ""
            if hasattr(response, 'candidates') and response.candidates:
                parts = response.candidates[0].content.parts
                content = "".join(p.text for p in parts if hasattr(p, 'text'))

            usage = {}
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = {
                    "prompt_tokens": response.usage_metadata.prompt_tokens,
                    "candidates_tokens": response.usage_metadata.candidates_tokens,
                    "total_tokens": response.usage_metadata.total_tokens,
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
        except Exception as e:
            self.mark_unavailable(str(e))
            raise

    async def embed(self, text: str, model: Optional[str] = None) -> Optional[List[float]]:
        try:
            import asyncio
            result = await asyncio.to_thread(
                lambda: self._genai.embed_content(
                    model=model or "models/text-embedding-004",
                    content=text
                )
            )
            return result['values'] if hasattr(result, '__getitem__') else result.values
        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def analyze_image(self, image_data: str, prompt: str, **kwargs) -> Optional[str]:
        try:
            import base64
            import asyncio
            m = model or self.model or "gemini-1.5-pro"

            if image_data.startswith("http"):
                import httpx
                resp = await asyncio.to_thread(lambda: httpx.get(image_data, timeout=30))
                img_bytes = resp.content
                image_data = base64.b64encode(img_bytes).decode()

            if image_data.startswith("data:"):
                image_data = image_data.split(",")[1]

            parts = [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/jpeg", "data": image_data}},
            ]

            gen_model = self._genai.GenerativeModel(m)
            response = await asyncio.to_thread(
                lambda: gen_model.generate_content(
                    contents=parts,
                    request_options={"timeout": 60}
                )
            )
            if hasattr(response, 'candidates') and response.candidates:
                return "".join(p.text for p in response.candidates[0].content.parts if hasattr(p, 'text'))
            return None
        except Exception as e:
            self.mark_unavailable(str(e))
            return None
