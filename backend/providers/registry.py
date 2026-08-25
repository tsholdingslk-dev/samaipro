"""
SAM AI - Provider Registry
Centralized registry that loads all AI provider adapters from environment
variables and database configuration.
"""

import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
from providers.base import ProviderAdapter, ProviderCapabilities, ProviderResponse, ProviderStatus, ProviderType
from providers.openai_adapter import OpenAIAdapter
from providers.claude_adapter import ClaudeAdapter
from providers.gemini_adapter import GeminiAdapter
from providers.speech_adapter import SpeechToTextAdapter, TextToSpeechAdapter
from providers.image_adapter import ImageGenerationAdapter
from providers.local_adapter import LocalLLMAdapter


@dataclass
class ProviderConfig:
    name: str
    kind: str
    api_key: str
    base_url: Optional[str]
    model: str
    priority: int = 1
    enabled: bool = True
    metadata: Dict[str, Any] = None


class ProviderRegistry:
    def __init__(self):
        self.providers: List[ProviderAdapter] = []
        self._configs: List[ProviderConfig] = []
        self._load_from_env()
        self._load_from_db()

    def _load_from_env(self):
        configs = []

        gemini_keys_str = os.getenv("GEMINI_API_KEY")
        if gemini_keys_str and gemini_keys_str != "your_gemini_api_key_here":
            keys = [k.strip() for k in gemini_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(keys):
                configs.append(ProviderConfig(
                    name=f"Gemini_{idx+1}",
                    kind="gemini",
                    api_key=key,
                    base_url=None,
                    model="gemini-2.5-flash",
                    priority=0,
                    metadata={"kind": "gemini"}
                ))

        claude_key = os.getenv("CLAUDE_API_KEY")
        if claude_key and claude_key != "your_claude_api_key_here":
            configs.append(ProviderConfig(
                name="Claude",
                kind="claude",
                api_key=claude_key,
                base_url=None,
                model="claude-3-5-sonnet-20241022",
                priority=1,
                metadata={"kind": "claude"}
            ))

        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and openai_key != "your_openai_api_key_here":
            configs.append(ProviderConfig(
                name="OpenAI",
                kind="openai",
                api_key=openai_key,
                base_url=None,
                model="gpt-4o-mini",
                priority=2,
                metadata={"kind": "openai"}
            ))

        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key != "your_groq_api_key_here":
            configs.append(ProviderConfig(
                name="Groq",
                kind="openai_compat",
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
                model="llama-3.3-70b-versatile",
                priority=3,
                metadata={"kind": "openai_compat", "display_name": "Groq"}
            ))

        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if openrouter_key and openrouter_key != "your_openrouter_api_key_here":
            configs.append(ProviderConfig(
                name="OpenRouter",
                kind="openai_compat",
                api_key=openrouter_key,
                base_url="https://openrouter.ai/api/v1",
                model="deepseek/deepseek-chat",
                priority=4,
                metadata={"kind": "openai_compat", "display_name": "OpenRouter"}
            ))

        inferx_keys_str = os.getenv("INFERX_API_KEY")
        if inferx_keys_str and inferx_keys_str != "your_inferx_api_key_here":
            keys = [k.strip() for k in inferx_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(keys):
                configs.append(ProviderConfig(
                    name=f"InferX_{idx+1}",
                    kind="openai_compat",
                    api_key=key,
                    base_url="https://model.inferx.net/endpoints/v1",
                    model="deepseek-v4-flash-0731",
                    priority=5,
                    metadata={"kind": "openai_compat", "display_name": f"InferX_{idx+1}"}
                ))

        hf_key = os.getenv("HUGGINGFACE_API_KEY")
        if hf_key and hf_key != "your_huggingface_api_key_here":
            configs.append(ProviderConfig(
                name="HuggingFace",
                kind="openai_compat",
                api_key=hf_key,
                base_url="https://router.huggingface.co/v1",
                model="Qwen/Qwen2.5-72B-Instruct",
                priority=99,
                metadata={"kind": "openai_compat", "display_name": "HuggingFace"}
            ))

        elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        if elevenlabs_key and elevenlabs_key != "your_elevenlabs_api_key_here":
            configs.append(ProviderConfig(
                name="ElevenLabs",
                kind="tts",
                api_key=elevenlabs_key,
                base_url=None,
                model="eleven_multilingual_v2",
                priority=1,
                metadata={"kind": "elevenlabs", "provider_type": ProviderType.TEXT_TO_SPEECH}
            ))

        whisper_key = os.getenv("WHISPER_API_KEY") or openai_key
        if whisper_key and whisper_key != "your_openai_api_key_here":
            configs.append(ProviderConfig(
                name="Whisper",
                kind="stt",
                api_key=whisper_key,
                base_url=None,
                model="whisper-1",
                priority=1,
                metadata={"kind": "openai_whisper", "provider_type": ProviderType.SPEECH_TO_TEXT}
            ))

        huggingface_key = os.getenv("HUGGINGFACE_API_KEY")
        if huggingface_key and huggingface_key != "your_huggingface_api_key_here":
            configs.append(ProviderConfig(
                name="StableDiffusion",
                kind="image",
                api_key=huggingface_key,
                base_url=None,
                model="stabilityai/stable-diffusion-xl-base-1.0",
                priority=1,
                metadata={"kind": "huggingface", "provider_type": ProviderType.IMAGE}
            ))

        dalle_key = os.getenv("OPENAI_API_KEY")
        if dalle_key and dalle_key != "your_openai_api_key_here":
            configs.append(ProviderConfig(
                name="DALL-E",
                kind="image",
                api_key=dalle_key,
                base_url=None,
                model="dall-e-3",
                priority=0,
                metadata={"kind": "openai_image", "provider_type": ProviderType.IMAGE}
            ))

        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
        if ollama_model and ollama_model != "your_ollama_model_here":
            configs.append(ProviderConfig(
                name="Local-Ollama",
                kind="local",
                api_key="not-needed",
                base_url=ollama_url,
                model=ollama_model,
                priority=100,
                metadata={"kind": "ollama", "provider_type": ProviderType.LOCAL}
            ))

        self._configs.extend(configs)

    def _load_from_db(self):
        try:
            from database import SessionLocal
            import models

            db = SessionLocal()
            db_providers = db.query(models.APIProvider).filter(
                models.APIProvider.status == "active"
            ).all()

            for p in db_providers:
                existing = any(
                    c.name.lower() == p.name.lower() and c.api_key == p.api_key
                    for c in self._configs
                )
                if not existing and p.api_key:
                    provider_type = ProviderType.TEXT
                    if "claude" in p.name.lower():
                        provider_type = ProviderType.TEXT
                    elif "tts" in p.name.lower() or "speech" in p.name.lower():
                        provider_type = ProviderType.TEXT_TO_SPEECH
                    elif "stt" in p.name.lower() or "whisper" in p.name.lower():
                        provider_type = ProviderType.SPEECH_TO_TEXT
                    elif "image" in p.name.lower() or "stable" in p.name.lower() or "dall" in p.name.lower():
                        provider_type = ProviderType.IMAGE
                    elif "local" in p.name.lower():
                        provider_type = ProviderType.LOCAL

                    self._configs.append(ProviderConfig(
                        name=p.name,
                        kind=p.name.lower(),
                        api_key=p.api_key,
                        base_url=p.base_url,
                        model=p.model,
                        priority=int(p.priority or 1),
                        metadata={"provider_type": provider_type.value}
                    ))
            db.close()
        except Exception as e:
            print(f"Registry DB load notice: {e}")

    def _create_adapter(self, config: ProviderConfig) -> Optional[ProviderAdapter]:
        kind = config.metadata.get("kind", config.kind) if config.metadata else config.kind
        provider_type = config.metadata.get("provider_type", ProviderType.TEXT) if config.metadata else ProviderType.TEXT

        try:
            if provider_type == ProviderType.TEXT_TO_SPEECH:
                return TextToSpeechAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.TEXT_TO_SPEECH,
                    kind=config.metadata.get("kind", "openai_tts") if config.metadata else "openai_tts",
                )
            elif provider_type == ProviderType.SPEECH_TO_TEXT:
                return SpeechToTextAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.SPEECH_TO_TEXT,
                    kind=config.metadata.get("kind", "openai_whisper") if config.metadata else "openai_whisper",
                )
            elif provider_type == ProviderType.IMAGE:
                return ImageGenerationAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    base_url=config.base_url,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.IMAGE,
                    kind=config.metadata.get("kind", "openai_image") if config.metadata else "openai_image",
                    **(config.metadata or {}),
                )
            elif provider_type == ProviderType.LOCAL:
                return LocalLLMAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    base_url=config.base_url,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.LOCAL,
                    kind=config.metadata.get("kind", "ollama") if config.metadata else "ollama",
                )
            elif kind == "claude":
                return ClaudeAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.TEXT,
                )
            elif kind == "gemini":
                return GeminiAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.TEXT,
                )
            elif kind in ("openai", "openai_compat"):
                return OpenAIAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    base_url=config.base_url,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.TEXT,
                )
            else:
                return OpenAIAdapter(
                    name=config.name,
                    api_key=config.api_key,
                    base_url=config.base_url,
                    model=config.model,
                    priority=config.priority,
                    provider_type=ProviderType.TEXT,
                )
        except Exception as e:
            print(f"Failed to create adapter for {config.name}: {e}")
            return None

    def register_adapter(self, adapter: ProviderAdapter):
        self.providers.append(adapter)

    def _init_providers(self):
        for config in self._configs:
            if not config.enabled:
                continue
            adapter = self._create_adapter(config)
            if adapter:
                self.providers.append(adapter)

        self.providers.sort(key=lambda p: p.priority)

    def get_providers_by_type(self, provider_type: ProviderType) -> List[ProviderAdapter]:
        return [p for p in self.providers if p.provider_type == provider_type and p._is_available()]

    def get_chat_providers(self) -> List[ProviderAdapter]:
        return [p for p in self.providers if p.capabilities.chat and p._is_available()]

    def get_embedding_providers(self) -> List[ProviderAdapter]:
        return [p for p in self.providers if p.capabilities.embedding and p._is_available()]

    def get_image_providers(self) -> List[ProviderAdapter]:
        return [p for p in self.providers if p.capabilities.image_generation and p._is_available()]

    def get_stt_providers(self) -> List[ProviderAdapter]:
        return [p for p in self.providers if p.capabilities.speech_to_text and p._is_available()]

    def get_tts_providers(self) -> List[ProviderAdapter]:
        return [p for p in self.providers if p.capabilities.text_to_speech and p._is_available()]

    def get_all_providers(self) -> List[ProviderAdapter]:
        return list(self.providers)

    def get_provider_names(self) -> List[str]:
        return [p.name for p in self.providers]

    def get_provider_status(self) -> List[Dict[str, Any]]:
        return [p.get_info() for p in self.providers]

    def reload(self):
        self.providers = []
        self._configs = []
        self._load_from_env()
        self._load_from_db()
        self._init_providers()


provider_registry = ProviderRegistry()
provider_registry._init_providers()
