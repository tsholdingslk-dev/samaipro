"""
SAM AI - Agora Communication Provider Adapter
"""

import time
import hashlib
import hmac
import base64
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import requests

from providers.communication.base import (
    CommunicationProvider, CommProviderCategory, CommProviderCapabilities,
    CommProviderStatus, CommRoomRequest, CommRoomResponse, CommTokenRequest,
    CommTokenResponse, CommRecordingRequest, CommRecordingResponse, CommHealthStatus
)


class AgoraAdapter(CommunicationProvider):
    def __init__(self, **kwargs):
        super().__init__(
            provider_id=kwargs.get("provider_id", "agora"),
            name=kwargs.get("name", "Agora"),
            category=CommProviderCategory.RTC,
            priority=kwargs.get("priority", 1),
            enabled=kwargs.get("enabled", True),
            credentials=kwargs.get("credentials", {}),
            configuration=kwargs.get("configuration", {}),
            quota=kwargs.get("quota", {}),
        )

    def _define_capabilities(self) -> CommProviderCapabilities:
        return CommProviderCapabilities(
            video_call=True,
            audio_call=True,
            group_call=True,
            screen_share=True,
            recording=True,
            live_streaming=True,
            chat=True,
            token_generation=True,
            meeting=True,
            max_participants=1000,
        )

    def _is_available(self) -> bool:
        app_id = self.credentials.get("app_id", "")
        app_certificate = self.credentials.get("app_certificate", "")
        if not app_id or not app_certificate:
            return False
        try:
            url = f"https://api.agora.io/v1/projects/{app_id}/cloud_recording/acquire"
            headers = {
                "Authorization": f"Basic {base64.b64encode(f'{app_id}:{app_certificate}'.encode()).decode()}",
                "Content-Type": "application/json"
            }
            resp = requests.get(url, headers=headers, timeout=5)
            return resp.status_code in (200, 400, 401)
        except Exception:
            return False

    def _generate_rtc_token(self, channel_name: str, user_id: str, expire_seconds: int = 3600) -> str:
        app_id = self.credentials.get("app_id", "")
        app_certificate = self.credentials.get("app_certificate", "")
        if not app_id or not app_certificate:
            raise ValueError("Agora credentials not configured")

        expire_timestamp = int(time.time()) + expire_seconds
        raw = f"{app_id}{channel_name}{user_id}{expire_timestamp}"
        signature = hmac.new(
            app_certificate.encode(),
            raw.encode(),
            hashlib.sha256
        ).digest()
        signature_b64 = base64.b64encode(signature).decode()

        token = f"{app_id}:{signature_b64}:{expire_timestamp}"
        return token

    def create_room(self, request: CommRoomRequest) -> CommRoomResponse:
        if not self._is_available():
            return CommRoomResponse(
                success=False,
                room_id=request.room_id,
                provider=self.provider_id,
                metadata={"error": "Provider unavailable"}
            )

        token = self._generate_rtc_token(request.room_id, "host", 3600)

        return CommRoomResponse(
            success=True,
            room_id=request.room_id,
            provider=self.provider_id,
            provider_room_id=request.room_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            join_url=f"https://webdemo.agora.io/{request.room_id}",
            metadata={
                "app_id": self.credentials.get("app_id"),
                "record": request.record,
                "max_participants": request.max_participants,
            }
        )

    def delete_room(self, room_id: str) -> Dict[str, Any]:
        return {"success": True, "room_id": room_id, "provider": self.provider_id}

    def generate_token(self, request: CommTokenRequest) -> CommTokenResponse:
        token = self._generate_rtc_token(request.room_id, request.user_id, request.expire_seconds)
        return CommTokenResponse(
            success=True,
            token=token,
            provider=self.provider_id,
            expires_at=datetime.utcnow() + timedelta(seconds=request.expire_seconds)
        )

    def join_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        token = self._generate_rtc_token(room_id, user_id, 3600)
        return {
            "success": True,
            "room_id": room_id,
            "user_id": user_id,
            "token": token,
            "provider": self.provider_id,
        }

    def leave_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        return {"success": True, "room_id": room_id, "user_id": user_id, "provider": self.provider_id}

    def start_recording(self, request: CommRecordingRequest) -> CommRecordingResponse:
        app_id = self.credentials.get("app_id", "")
        app_certificate = self.credentials.get("app_certificate", "")
        if not app_id or not app_certificate:
            return CommRecordingResponse(
                success=False,
                recording_id=request.recording_id or "",
                provider=self.provider_id,
                status="error",
                metadata={"error": "Credentials not configured"}
            )

        recording_id = request.recording_id or f"rec_{int(time.time())}"
        return CommRecordingResponse(
            success=True,
            recording_id=recording_id,
            provider=self.provider_id,
            status="recording",
            metadata={
                "app_id": app_id,
                "resource_id": recording_id,
                "mode": request.output_mode,
            }
        )

    def stop_recording(self, recording_id: str) -> Dict[str, Any]:
        return {"success": True, "recording_id": recording_id, "provider": self.provider_id}

    def get_recording(self, recording_id: str) -> CommRecordingResponse:
        return CommRecordingResponse(
            success=True,
            recording_id=recording_id,
            provider=self.provider_id,
            status="completed",
            metadata={"file_url": None}
        )

    def get_usage(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        return {
            "provider": self.provider_id,
            "minutes": 0,
            "participants": 0,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            }
        }
