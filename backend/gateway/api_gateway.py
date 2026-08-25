"""
SAM AI - API Gateway
Centralized request routing with rate limiting, service discovery, and health monitoring.
Provides unified response format across all services.
"""

import time
import json
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from collections import defaultdict
from enum import Enum
from fastapi import Request, HTTPException, Response
from starlette.responses import JSONResponse


class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class ServiceEndpoint:
    service_name: str
    path: str
    method: str
    handler: Callable
    rate_limit: int = 100
    rate_window: int = 60
    timeout: float = 30.0


@dataclass
class HealthCheck:
    service_name: str
    status: ServiceStatus
    latency_ms: float
    error_count: int
    last_check: datetime
    uptime_pct: float
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RateLimitInfo:
    requests_remaining: int
    reset_at: datetime
    blocked: bool = False


class APIGateway:
    def __init__(self):
        self.services: Dict[str, List[ServiceEndpoint]] = defaultdict(list)
        self.health_checks: Dict[str, HealthCheck] = {}
        self.rate_limiter = TokenBucketRateLimiter()
        self.request_log: List[Dict[str, Any]] = []
        self.max_log_size = 10000
        self.service_registry = ServiceRegistry()
        self.response_formatter = UnifiedResponseFormatter()

    def register_service(self, service_name: str, endpoints: List[ServiceEndpoint]):
        for ep in endpoints:
            self.services[service_name].append(ep)
            self.health_checks[service_name] = HealthCheck(
                service_name=service_name,
                status=ServiceStatus.UNKNOWN,
                latency_ms=0,
                error_count=0,
                last_check=datetime.utcnow(),
                uptime_pct=100.0,
            )

    def check_rate_limit(self, user_id: str, service_name: str, endpoint_path: str) -> RateLimitInfo:
        key = f"{user_id}:{service_name}:{endpoint_path}"
        return self.rate_limiter.check(key)

    async def route_request(self, request: Request, service_name: str, endpoint_path: str) -> Any:
        request_id = str(uuid.uuid4())
        start_time = time.time()

        user_id = request.headers.get("X-User-ID", "anonymous")

        rate_info = self.check_rate_limit(user_id, service_name, endpoint_path)
        if rate_info.blocked:
            self._log_request(request_id, service_name, endpoint_path, user_id, 429, time.time() - start_time)
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        try:
            service_endpoints = self.services.get(service_name, [])
            matched = [e for e in service_endpoints if e.path == endpoint_path]
            if not matched:
                self._log_request(request_id, service_name, endpoint_path, user_id, 404, time.time() - start_time)
                raise HTTPException(status_code=404, detail=f"Endpoint {endpoint_path} not found in {service_name}")

            endpoint = matched[0]

            try:
                result = await asyncio.wait_for(endpoint.handler(request), timeout=endpoint.timeout)
            except asyncio.TimeoutError:
                self._update_health(service_name, False, 30000)
                self._log_request(request_id, service_name, endpoint_path, user_id, 504, time.time() - start_time)
                raise HTTPException(status_code=504, detail="Service timeout")

            self._update_health(service_name, True, (time.time() - start_time) * 1000)
            self._log_request(request_id, service_name, endpoint_path, user_id, 200, time.time() - start_time)

            return self.response_formatter.format_request_response(
                result, request_id, service_name, endpoint_path, time.time() - start_time
            )

        except HTTPException:
            self._log_request(request_id, service_name, endpoint_path, user_id, 500, time.time() - start_time)
            raise
        except Exception as e:
            self._log_request(request_id, service_name, endpoint_path, user_id, 500, time.time() - start_time)
            raise HTTPException(status_code=500, detail=str(e))

    def _update_health(self, service_name: str, success: bool, latency_ms: float):
        if service_name not in self.health_checks:
            self.health_checks[service_name] = HealthCheck(
                service_name=service_name, status=ServiceStatus.UNKNOWN,
                latency_ms=0, error_count=0, last_check=datetime.utcnow(), uptime_pct=100.0
            )

        hc = self.health_checks[service_name]
        hc.last_check = datetime.utcnow()
        hc.latency_ms = latency_ms

        if success:
            hc.status = ServiceStatus.HEALTHY if latency_ms < 2000 else ServiceStatus.DEGRADED
        else:
            hc.error_count += 1
            hc.status = ServiceStatus.UNHEALTHY

    def _log_request(self, request_id: str, service: str, path: str, user_id: str, status: int, duration: float):
        entry = {
            "request_id": request_id,
            "service": service,
            "path": path,
            "user_id": user_id,
            "status": status,
            "duration_ms": round(duration * 1000, 2),
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.request_log.append(entry)
        if len(self.request_log) > self.max_log_size:
            self.request_log = self.request_log[-5000:]

    def get_gateway_stats(self) -> Dict[str, Any]:
        now = datetime.utcnow()
        last_minute = [e for e in self.request_log if e["timestamp"] > (now - timedelta(minutes=1)).isoformat()]
        last_hour = [e for e in self.request_log if e["timestamp"] > (now - timedelta(hours=1)).isoformat()]

        return {
            "total_requests": len(self.request_log),
            "requests_last_minute": len(last_minute),
            "requests_last_hour": len(last_hour),
            "active_services": len(self.services),
            "services": {
                name: {
                    "status": hc.status.value,
                    "latency_ms": round(hc.latency_ms, 2),
                    "uptime_pct": round(hc.uptime_pct, 2),
                    "error_count": hc.error_count,
                }
                for name, hc in self.health_checks.items()
            },
        }


class TokenBucketRateLimiter:
    def __init__(self):
        self.buckets: Dict[str, Dict[str, Any]] = {}
        self.default_capacity = 100
        self.default_refill_rate = 100

    def check(self, key: str) -> RateLimitInfo:
        now = time.time()

        if key not in self.buckets:
            self.buckets[key] = {
                "tokens": self.default_capacity,
                "capacity": self.default_capacity,
                "refill_rate": self.default_refill_rate,
                "last_refill": now,
            }

        bucket = self.buckets[key]
        time_passed = now - bucket["last_refill"]
        tokens_to_add = time_passed * bucket["refill_rate"]
        bucket["tokens"] = min(bucket["tokens"] + tokens_to_add, bucket["capacity"])
        bucket["last_refill"] = now

        if bucket["tokens"] >= 1:
            bucket["tokens"] -= 1
            return RateLimitInfo(
                requests_remaining=int(bucket["tokens"]),
                reset_at=datetime.utcnow() + timedelta(seconds=60),
                blocked=False,
            )
        else:
            return RateLimitInfo(
                requests_remaining=0,
                reset_at=datetime.utcnow() + timedelta(seconds=60),
                blocked=True,
            )


class ServiceRegistry:
    def __init__(self):
        self.services: Dict[str, Dict[str, Any]] = {}

    def register(self, name: str, url: str, health_url: str, metadata: Dict[str, Any] = None):
        self.services[name] = {
            "name": name,
            "url": url,
            "health_url": health_url,
            "metadata": metadata or {},
            "registered_at": datetime.utcnow(),
        }

    def discover(self, pattern: str = None) -> List[Dict[str, Any]]:
        results = list(self.services.values())
        if pattern:
            results = [s for s in results if pattern.lower() in s["name"].lower()]
        return results

    def get_service(self, name: str) -> Optional[Dict[str, Any]]:
        return self.services.get(name)

    def unregister(self, name: str):
        self.services.pop(name, None)


class UnifiedResponseFormatter:
    def format_request_response(
        self, result: Any, request_id: str, service: str, path: str, duration: float
    ) -> Dict[str, Any]:
        if isinstance(result, dict):
            result = {k: v for k, v in result.items() if k not in ("request_id", "timestamp")}
        else:
            result = {"output": result}

        result["request_id"] = request_id
        result["service"] = service
        result["endpoint"] = path
        result["latency_ms"] = round(duration * 1000, 2)
        result["timestamp"] = datetime.utcnow().isoformat()
        result["status"] = result.get("status", "success")

        return result

    def format_error(self, error: str, code: int, request_id: str) -> JSONResponse:
        return JSONResponse(
            status_code=code,
            content={
                "status": "error",
                "error": error,
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

    def format_success(self, data: Any, request_id: str = None) -> Dict[str, Any]:
        return {
            "status": "success",
            "data": data,
            "request_id": request_id or str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
        }


api_gateway = APIGateway()
