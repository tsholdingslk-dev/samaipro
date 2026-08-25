"""
SAM AI - Speech Provider Adapters
Speech-to-Text (Whisper, etc.) and Text-to-Speech (ElevenLabs, etc.)
"""

import time
import io
from typing import Dict, Any, List, Optional
from providers.base import ProviderAdapter, ProviderCapabilities, ProviderType, ProviderResponse


class SpeechToTextAdapter(ProviderAdapter):
    def _define_capabilities(self) -> ProviderCapabilities:
        model = (self.model or "").lower()
        return ProviderCapabilities(
            speech_to_text=True,
            max_tokens=4000,
        )

    def _init_client(self):
        self.provider_kind = self._kwargs.get("kind", "openai_whisper")

    def _is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

    async def transcribe_audio(self, audio_data: bytes, **kwargs) -> Optional[str]:
        start = time.time()
        try:
            if self.provider_kind == "openai_whisper":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=self.api_key)
                file_obj = io.BytesIO(audio_data)
                file_obj.name = kwargs.get("filename", "audio.wav")
                response = await client.audio.transcriptions.create(
                    model=kwargs.get("model", "whisper-1"),
                    file=file_obj,
                    response_format=kwargs.get("response_format", "text"),
                )
                return response if isinstance(response, str) else getattr(response, 'text', '')
            elif self.provider_kind == "deepgram":
                import aiohttp
                url = f"https://api.deepgram.com/v1/listen?punctuate=true&model={kwargs.get('model', 'general')}"
                headers = {"Authorization": f"Token {self.api_key}"}
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, headers=headers, data=audio_data) as resp:
                        result = await resp.json()
                        return result.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "")
            else:
                raise ValueError(f"Unknown STT provider: {self.provider_kind}")
        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def chat(self, messages: List[Dict[str, Any]], model: Optional[str] = None, **kwargs) -> ProviderResponse:
        raise NotImplementedError("STT adapter does not support chat")


class TextToSpeechAdapter(ProviderAdapter):
    def _define_capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            text_to_speech=True,
            max_tokens=4000,
        )

    def _init_client(self):
        self.provider_kind = self._kwargs.get("kind", "openai_tts")

    def _is_available(self) -> bool:
        return self.api_key is not None and len(self.api_key) > 0

    async def synthesize_speech(self, text: str, voice: str = "alloy", **kwargs) -> Optional[bytes]:
        try:
            if self.provider_kind == "openai_tts":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=self.api_key)
                response = await client.audio.speech.create(
                    model=kwargs.get("model", "tts-1"),
                    voice=kwargs.get("voice", voice),
                    input=text,
                    response_format=kwargs.get("format", "mp3"),
                )
                return await response.aread()
            elif self.provider_kind == "elevenlabs":
                import aiohttp
                model_id = kwargs.get("model", "eleven_multilingual_v2")
                voice_id = kwargs.get("voice_id", "21m00Tcm4TlvDq8ft6Th")
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                headers = {
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json",
                }
                payload = {
                    "text": text,
                    "model_id": model_id,
                    "voice_settings": {
                        "stability": kwargs.get("stability", 0.5),
                        "similarity_boost": kwargs.get("similarity_boost", 0.5),
                    },
                }
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload, headers=headers) as resp:
                        if resp.status == 200:
                            return await resp.read()
                        else:
                            text_resp = await resp.text()
                            raise Exception(f"ElevenLabs error: {resp.status} - {text_resp[:200]}")
            else:
                raise ValueError(f"Unknown TTS provider: {self.provider_kind}")
        except Exception as e:
            self.mark_unavailable(str(e))
            return None

    async def chat(self, messages: List[Dict[str, Any]], model: Optional[str] = None, **kwargs) -> ProviderResponse:
        raise NotImplementedError("TTS adapter does not support chat")
