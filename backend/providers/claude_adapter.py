"""
SAM AI - Claude (Anthropic) Provider Adapter
Supports Claude 3/3.5/4 models with full chat, vision, and tool-use capabilities.
"""

import time
import json
from typing import Dict, Any, List, Optional
from providers.base import ProviderAdapter, ProviderCapabilities, ProviderType, ProviderResponse

ANTHROPIC_API_BASE = "https://api.anthropic.com"


class ClaudeAdapter(ProviderAdapter):
    def _define_capabilities(self) -> ProviderCapabilities:
        model = (self.model or "").lower()
        caps = ProviderCapabilities(
            chat=True,
            streaming=True,
            json_mode=False,
            max_tokens=200000,
        )
        if "opus" in model or "sonnet" in model or "haiku" in model:
            caps.multimodal = True
            caps.image_analysis = True
        if "3.7" in model or "4" in model or "opus" in model:
            caps.json_mode = True
        return caps

    def _init_client(self):
        self.base_url = ANTHROPIC_API_BASE
        import anthropic
        self.client = anthropic.AsyncAnthropic(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=60.0,
        )
        self._sync_client = anthropic.Anthropic(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=60.0,
        )

    def _is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 10

    def _convert_messages(self, messages: List[Dict[str, Any]]) -> tuple:
        system_prompt = ""
        claude_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_prompt = content
            elif role == "user":
                if isinstance(content, str):
                    claude_messages.append({"role": "user", "content": content})
                elif isinstance(content, list):
                    claude_messages.append({"role": "user", "content": content})
            elif role == "assistant":
                if isinstance(content, str):
                    claude_messages.append({"role": "assistant", "content": content})
                else:
                    claude_messages.append({"role": "assistant", "content": content})
        return system_prompt, claude_messages

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        **kwargs
    ) -> ProviderResponse:
        start = time.time()
        m = model or self.model or "claude-3-5-sonnet-20241022"
        system_prompt, claude_messages = self._convert_messages(messages)

        params = {
            "model": m,
            "messages": claude_messages,
            "max_tokens": kwargs.get("max_tokens", 4096),
            "temperature": kwargs.get("temperature", 0.7),
        }
        if system_prompt:
            params["system"] = system_prompt

        try:
            response = await self.client.messages.create(**params)
            latency = time.time() - start
            content = response.content[0].text if response.content else ""
            usage = {}
            if hasattr(response, 'usage') and response.usage:
                usage = {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                }
            elif hasattr(response, 'usage') and response.usage:
                usage = {
                    "input_tokens": getattr(response.usage, 'input_tokens', 0),
                    "output_tokens": getattr(response.usage, 'output_tokens', 0),
                    "total_tokens": getattr(response.usage, 'input_tokens', 0) + getattr(response.usage, 'output_tokens', 0),
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
            import numpy as np
            response = await self.client.messages.count_tokens(
                model=model or self.model,
                messages=[{"role": "user", "content": text}]
            )
            return None
        except Exception:
            return None

    async def analyze_image(self, image_data: str, prompt: str, **kwargs) -> Optional[str]:
        try:
            if image_data.startswith("http"):
                image_content = {"type": "image", "source": {"type": "url", "url": image_data}}
            else:
                image_content = {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_data}}

            messages = [
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    image_content
                ]}
            ]
            system_prompt, claude_messages = self._convert_messages(messages)
            response = await self.client.messages.create(
                model=model or self.model or "claude-3-5-sonnet-20241022",
                messages=claude_messages,
                max_tokens=4096,
                temperature=0.7,
            )
            return response.content[0].text if response.content else None
        except Exception as e:
            self.mark_unavailable(str(e))
            return None
