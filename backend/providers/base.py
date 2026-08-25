"""
SAM AI - Provider Adapter Base
Defines the unified interface that all AI provider adapters implement.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class ProviderType(str, Enum):
    TEXT = "text"
    EMBEDDING = "embedding"
    IMAGE = "image"
    SPEECH_TO_TEXT = "speech_to_text"
    TEXT_TO_SPEECH = "text_to_speech"
    VIDEO = "video"
    LOCAL = "local"


@dataclass
class ProviderCapabilities:
    chat: bool = False
    embedding: bool = False
    image_generation: bool = False
    image_analysis: bool = False
    speech_to_text: bool = False
    text_to_speech: bool = False
    json_mode: bool = False
    streaming: bool = False
    max_tokens: int = 8192
    multimodal: bool = False
    fine_tuning: bool = False

    def as_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items()}


@dataclass
class ProviderResponse:
    provider_name: str
    provider_type: str
    model: str
    content: Optional[str] = None
    usage: Dict[str, Any] = field(default_factory=dict)
    cost: float = 0.0
    latency_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    raw_response: Optional[Any] = None


@dataclass
class ProviderStatus:
    name: str
    available: bool
    status: str  # "active", "error", "rate_limited", "inactive", "cooldown"
    last_check: Optional[datetime] = None
    error_message: Optional[str] = None
    cooldown_until: Optional[datetime] = None


class ProviderAdapter(ABC):
    """Abstract base class for all AI provider adapters."""

    def __init__(
        self,
        name: str,
        api_key: str,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        priority: int = 1,
        provider_type: ProviderType = ProviderType.TEXT,
        **kwargs
    ):
        self.name = name
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.priority = priority
        self.provider_type = provider_type
        self.capabilities = self._define_capabilities()
        self.status = ProviderStatus(
            name=name,
            available=True,
            status="active"
        )
        self._kwargs = kwargs
        self._init_client()

    @abstractmethod
    def _define_capabilities(self) -> ProviderCapabilities:
        pass

    @abstractmethod
    def _init_client(self) -> None:
        pass

    @abstractmethod
    def _is_available(self) -> bool:
        pass

    def check_availability(self) -> ProviderStatus:
        self.status.available = self._is_available()
        self.status.last_check = datetime.utcnow()
        return self.status

    def mark_unavailable(self, reason: str = "unknown"):
        self.status.available = False
        self.status.status = "error"
        self.status.error_message = reason
        self.status.last_check = datetime.utcnow()

    def mark_rate_limited(self, cooldown_seconds: int = 60):
        self.status.available = False
        self.status.status = "rate_limited"
        self.status.cooldown_until = datetime.utcnow().timestamp() + cooldown_seconds
        self.status.last_check = datetime.utcnow()

    def reset_status(self):
        self.status = ProviderStatus(
            name=self.name,
            available=True,
            status="active"
        )

    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        **kwargs
    ) -> ProviderResponse:
        pass

    async def embed(self, text: str, model: Optional[str] = None) -> Optional[List[float]]:
        return None

    async def generate_image(self, prompt: str, **kwargs) -> Optional[str]:
        return None

    async def analyze_image(self, image_data: str, prompt: str, **kwargs) -> Optional[str]:
        return None

    async def transcribe_audio(self, audio_data: bytes, **kwargs) -> Optional[str]:
        return None

    async def synthesize_speech(self, text: str, voice: str = "default", **kwargs) -> Optional[bytes]:
        return None

    def get_info(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "type": self.provider_type.value,
            "model": self.model,
            "priority": self.priority,
            "status": self.status.status,
            "available": self.status.available,
            "capabilities": self.capabilities.as_dict(),
            "base_url": self.base_url,
        }
