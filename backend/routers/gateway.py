from fastapi import APIRouter, Depends, HTTPException, Request
from database import get_db
from security import get_current_user, require_admin
from gateway.api_gateway import api_gateway

router = APIRouter(
    prefix="/gateway",
    tags=["API Gateway"]
)


@router.get("/stats")
async def get_gateway_stats(
    current_user: dict = Depends(require_admin)
):
    return api_gateway.get_gateway_stats()


@router.get("/services")
async def discover_services(
    pattern: str = None,
    current_user: dict = Depends(get_current_user),
):
    return {"services": api_gateway.service_registry.discover(pattern) if pattern else api_gateway.service_registry.discover()}


@router.get("/health")
async def get_all_health(
    current_user: dict = Depends(require_admin)
):
    return {
        "services": [
            {
                "name": hc.service_name,
                "status": hc.status.value,
                "latency_ms": round(hc.latency_ms, 2),
                "uptime_pct": round(hc.uptime_pct, 2),
                "error_count": hc.error_count,
                "last_check": hc.last_check.isoformat(),
            }
            for hc in api_gateway.health_checks.values()
        ]
    }
