from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from security import get_current_user, require_admin, require_staff
from orchestrator.task_router import task_router, PipelineStage

router = APIRouter(
    prefix="/orchestrator",
    tags=["AI Orchestrator"]
)


class OrchestratorRequest(BaseModel):
    message: str
    project_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    use_agents: Optional[bool] = True
    priority: Optional[str] = "normal"  # low, normal, high


class OrchestratorResponse(BaseModel):
    request_id: str
    response: str
    intent: str
    module: str
    agent_used: Optional[str] = None
    provider: Optional[str] = None
    confidence: float
    complexity: str
    duration_ms: float
    pipeline: List[Dict[str, Any]]
    metadata: Dict[str, Any]


@router.post("/", response_model=OrchestratorResponse)
async def route_request(
    request: OrchestratorRequest,
    current_user: dict = Depends(get_current_user)
):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    context = request.context or {}
    context["user_id"] = current_user["user_id"]
    context["role"] = current_user["role"]
    context["project_id"] = request.project_id or context.get("project_id", "general")

    result = await task_router._execute_routing(request.message, context)

    pipeline_summary = [
        {
            "stage": s.stage.value,
            "status": s.status,
            "duration_ms": round(s.duration_ms, 2),
            "details": s.details,
            "error": s.error,
        }
        for s in result.pipeline
    ]

    return OrchestratorResponse(
        request_id=result.request_id,
        response=result.final_response,
        intent=result.classification.primary_intent.value,
        module=result.module.module_name,
        agent_used=result.used_agent,
        provider=result.provider_used,
        confidence=result.classification.confidence,
        complexity=result.classification.complexity,
        duration_ms=result.total_duration_ms,
        pipeline=pipeline_summary,
        metadata=result.metadata,
    )


@router.get("/modules")
async def get_modules(
    current_user: dict = Depends(get_current_user)
):
    return {"modules": task_router.module_selector.get_all_modules()}


@router.get("/health")
async def orchestrator_health(
    current_user: dict = Depends(get_current_user)
):
    return await task_router.health_check()


@router.get("/history")
async def get_routing_history(
    limit: int = 50,
    current_user: dict = Depends(require_admin)
):
    return {"history": task_router.get_routing_history(limit=limit)}


@router.get("/model-stats")
async def get_model_stats(
    current_user: dict = Depends(require_admin)
):
    return {"stats": task_router.model_selector.get_provider_stats()}
