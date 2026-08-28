"""
SAM AI - Communication Provider Adapters
Unified interface for RTC communication providers (Agora, LiveKit, Jitsi, WebRTC)
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class CommProviderCategory(str, Enum):
    RTC = "rtc"
    CHAT = "chat"
    VIDEO = "video"
    AUDIO = "audio"
    STREAMING = "streaming"
    RECORDING = "recording"
    AI = "ai"
    STORAGE = "storage"


class CommProviderStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


@dataclass
class CommProviderCapabilities:
    video_call: bool = False
    audio_call: bool = False
    group_call: bool = False
    screen_share: bool = False
    recording: bool = False
    live_streaming: bool = False
    chat: bool = False
    token_generation: bool = False
    meeting: bool = False
    transcription: bool = False
    translation: bool = False
    max_participants: int = 0

    def as_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items()}


@dataclass
class CommRoomRequest:
    room_id: str
    room_name: Optional[str] = None
    room_type: str = "video"
    max_participants: int = 10
    record: bool = False
    enable_chat: bool = True
    enable_screen_share: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CommRoomResponse:
    success: bool
    room_id: str
    provider: str
    provider_room_id: Optional[str] = None
    token: Optional[str] = None
    expires_at: Optional[datetime] = None
    join_url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CommTokenRequest:
    room_id: str
    user_id: str
    user_name: str
    role: str = "publisher"
    expire_seconds: int = 3600
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CommTokenResponse:
    success: bool
    token: str
    provider: str
    expires_at: datetime


@dataclass
class CommRecordingRequest:
    room_id: str
    recording_id: Optional[str] = None
    output_mode: str = "individual"  # individual, composite, audio_only
    resolution: str = "720p"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CommRecordingResponse:
    success: bool
    recording_id: str
    provider: str
    status: str
    file_url: Optional[str] = None
    duration: Optional[int] = None
    size_bytes: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CommHealthStatus:
    provider: str
    status: CommProviderStatus
    latency_ms: float = 0.0
    last_check: Optional[datetime] = None
    error_message: Optional[str] = None
    quota_remaining: Optional[int] = None
    quota_limit: Optional[int] = None
    details: Dict[str, Any] = field(default_factory=dict)


class CommunicationProvider(ABC):
    """Abstract base class for all communication provider adapters."""

    def __init__(
        self,
        provider_id: str,
        name: str,
        category: CommProviderCategory,
        priority: int = 1,
        enabled: bool = True,
        credentials: Dict[str, Any] = None,
        configuration: Dict[str, Any] = None,
        quota: Dict[str, Any] = None,
        **kwargs
    ):
        self.provider_id = provider_id
        self.name = name
        self.category = category
        self.priority = priority
        self.enabled = enabled
        self.credentials = credentials or {}
        self.configuration = configuration or {}
        self.quota = quota or {}
        self.capabilities = self._define_capabilities()
        self.health_status = CommHealthStatus(
            provider=provider_id,
            status=CommProviderStatus.UNKNOWN
        )

    @abstractmethod
    def _define_capabilities(self) -> CommProviderCapabilities:
        pass

    @abstractmethod
    def _is_available(self) -> bool:
        pass

    def check_health(self) -> CommHealthStatus:
        self.health_status.status = CommProviderStatus.HEALTHY if self._is_available() else CommProviderStatus.UNAVAILABLE
        self.health_status.last_check = datetime.utcnow()
        return self.health_status

    @abstractmethod
    def create_room(self, request: CommRoomRequest) -> CommRoomResponse:
        pass

    @abstractmethod
    def delete_room(self, room_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_token(self, request: CommTokenRequest) -> CommTokenResponse:
        pass

    @abstractmethod
    def join_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def leave_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        pass

    def start_recording(self, request: CommRecordingRequest) -> CommRecordingResponse:
        raise NotImplementedError(f"Recording not supported by {self.name}")

    def stop_recording(self, recording_id: str) -> Dict[str, Any]:
        raise NotImplementedError(f"Recording not supported by {self.name}")

    def get_recording(self, recording_id: str) -> CommRecordingResponse:
        raise NotImplementedError(f"Recording not supported by {self.name}")

    def get_usage(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        return {}

    def get_info(self) -> Dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "name": self.name,
            "category": self.category.value,
            "priority": self.priority,
            "enabled": self.enabled,
            "capabilities": self.capabilities.as_dict(),
            "health": self.health_status.status.value,
            "quota": self.quota,
        }
