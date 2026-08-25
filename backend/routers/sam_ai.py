from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from database import get_db
from security import get_current_user, require_admin
from core.sam_ai_core import sam_ai_core, TaskPriority

router = APIRouter(
    prefix="/sam",
    tags=["Sam AI Core"]
)


class SamAITaskRequest(BaseModel):
    task: str
    context: Optional[Dict[str, Any]] = None
    priority: Optional[str] = "medium"
    deadline: Optional[str] = None
    stream: Optional[bool] = False


@router.post("/process")
async def process_task(
    request: SamAITaskRequest,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Process a task through the full Sam AI pipeline.

    Understanding → Planning → Execution → Validation → Learning
    """
    priority = TaskPriority(request.priority.lower()) if request.priority.lower() in [p.value for p in TaskPriority] else TaskPriority.MEDIUM
    deadline = datetime.fromisoformat(request.deadline) if request.deadline else None

    result = await sam_ai_core.process_task(
        description=request.task,
        user_id=current_user["user_id"],
        context=request.context,
        priority=priority,
        deadline=deadline,
    )

    return {
        "task_id": result.task_id,
        "status": result.status,
        "result": result.result,
        "understanding": result.understanding,
        "plan": {
            "steps": result.plan.steps,
            "agents": result.plan.agents_involved,
            "estimated_cost": result.plan.estimated_cost,
            "risk_level": result.plan.risk_level,
        },
        "confidence": result.confidence,
        "citations": result.citations,
        "trace": result.execution_trace,
        "metadata": result.metadata,
        "execution_time_ms": result.total_execution_time_ms,
    }


@router.get("/status")
async def get_system_status(
    current_user: dict = Depends(require_admin),
):
    return sam_ai_core.get_system_status()


@router.post("/understand")
async def understand_task(
    task: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
):
    """Just run the understanding stage - classify intent and select model."""
    understanding = await sam_ai_core.understand(task, {}, current_user["user_id"])
    return {
        "intent_category": understanding["intent_category"],
        "confidence": understanding["confidence"],
        "module": understanding["module"],
        "model": understanding["model"],
        "requires_research": understanding["requires_research"],
        "requires_code": understanding["requires_code"],
        "requires_multimodal": understanding["requires_multimodal"],
    }


@router.post("/plan")
async def create_plan(
    task: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
):
    """Create an execution plan for a task."""
    understanding = await sam_ai_core.understand(task, {}, current_user["user_id"])
    plan = await sam_ai_core.plan(task, understanding, {})
    return {
        "intent": understanding["intent_category"],
        "model": understanding["model"],
        "plan": {
            "steps": plan.steps,
            "agents_involved": plan.agents_involved,
            "estimated_time_ms": plan.estimated_time_ms,
            "estimated_cost": plan.estimated_cost,
            "risk_level": plan.risk_level,
            "required_permissions": plan.required_permissions,
        }
    }


@router.get("/agents")
async def list_all_agents(
    current_user: dict = Depends(get_current_user),
):
    from agents import agent_executor
    return {
        "count": agent_executor.get_agent_count(),
        "agents": agent_executor.get_agent_info(),
    }


@router.get("/conversation/{session_id}")
async def get_conversation(
    session_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    history = sam_ai_core.conversation_history.get(session_id, [])[-limit:]
    return {"session_id": session_id, "messages": history}
