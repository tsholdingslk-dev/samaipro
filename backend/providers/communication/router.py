"""
SAM AI - Communication Provider Registry and Router
Manages all communication providers and routes requests to the best provider.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

from providers.communication.base import (
    CommunicationProvider, CommProviderCapabilities, CommProviderStatus,
    CommRoomRequest, CommHealthStatus
)


class CommunicationProviderRegistry:
    def __init__(self):
        self.providers: Dict[str, CommunicationProvider] = {}

    def register(self, provider: CommunicationProvider):
        self.providers[provider.provider_id] = provider

    def get_provider(self, provider_id: str) -> Optional[CommunicationProvider]:
        return self.providers.get(provider_id)

    def get_all_providers(self) -> List[CommunicationProvider]:
        return list(self.providers.values())

    def get_enabled_providers(self) -> List[CommunicationProvider]:
        return [p for p in self.providers.values() if p.enabled]

    def get_healthy_providers(self) -> List[CommunicationProvider]:
        return [p for p in self.providers.values() if p.enabled and p.health_status.status == CommProviderStatus.HEALTHY]

    def check_all_health(self) -> List[CommHealthStatus]:
        results = []
        for provider in self.providers.values():
            if provider.enabled:
                results.append(provider.check_health())
            else:
                results.append(CommHealthStatus(
                    provider=provider.provider_id,
                    status=CommProviderStatus.UNAVAILABLE,
                    error_message="Provider disabled"
                ))
        return results

    def reload(self):
        pass


class CommunicationProviderRouter:
    def __init__(self, registry: CommunicationProviderRegistry):
        self.registry = registry

    def route_request(self, request: CommRoomRequest, strategy: str = "priority") -> Optional[CommunicationProvider]:
        candidates = self._get_candidates(request)
        if not candidates:
            return None

        if strategy == "priority":
            return min(candidates, key=lambda p: p.priority)
        elif strategy == "lowest_cost":
            return candidates[0]
        elif strategy == "highest_quality":
            return max(candidates, key=lambda p: p.capabilities.max_participants)
        elif strategy == "lowest_latency":
            return min(candidates, key=lambda p: p.health_status.latency_ms or float('inf'))
        elif strategy == "round_robin":
            return candidates[0]
        elif strategy == "weighted":
            import random
            return random.choice(candidates)
        elif strategy == "failover":
            primary = min(candidates, key=lambda p: p.priority)
            if primary.health_status.status == CommProviderStatus.HEALTHY:
                return primary
            fallbacks = [p for p in candidates if p != primary and p.health_status.status == CommProviderStatus.HEALTHY]
            return fallbacks[0] if fallbacks else None
        else:
            return min(candidates, key=lambda p: p.priority)

    def _get_candidates(self, request: CommRoomRequest) -> List[CommunicationProvider]:
        candidates = []
        for provider in self.registry.get_enabled_providers():
            caps = provider.capabilities
            if request.room_type == "video" and not caps.video_call:
                continue
            if request.room_type == "audio" and not caps.audio_call:
                continue
            if request.record and not caps.recording:
                continue
            if request.enable_screen_share and not caps.screen_share:
                continue
            if request.max_participants > (caps.max_participants or 0):
                continue
            if provider.health_status.status == CommProviderStatus.UNAVAILABLE:
                continue
            candidates.append(provider)
        return candidates

    def get_route_decision(self, request: CommRoomRequest) -> Dict[str, Any]:
        selected = self.route_request(request)
        if not selected:
            return {
                "success": False,
                "error": "NO_PROVIDER_AVAILABLE",
                "message": "No communication provider available for this request.",
                "candidates": [p.provider_id for p in self.registry.get_enabled_providers()],
            }

        return {
            "success": True,
            "selected_provider": selected.provider_id,
            "reason": "Provider meets all requirements and is healthy.",
            "provider_info": selected.get_info(),
        }


comm_registry = CommunicationProviderRegistry()
comm_router = CommunicationProviderRouter(comm_registry)
