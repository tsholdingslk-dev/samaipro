"""
SAM AI - Analytics + Cost Router
Endpoints for usage analytics, cost tracking, and system dashboards.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
from security import get_current_user, require_admin
from analytics.cost_tracker import cost_tracker
from analytics.analytics import analytics_engine

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics + Cost"]
)


class FeedbackRequest(BaseModel):
    module: str
    rating: int
    feedback: Optional[str] = None


class TrackEventRequest(BaseModel):
    event_type: str
    module: str
    duration_ms: Optional[float] = 0
    metadata: Optional[dict] = None


@router.get("/dashboard")
async def get_dashboard(
    days: int = 7,
    db_session=Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    return analytics_engine.get_system_dashboard(days=days)


@router.get("/user/activity/{user_id}")
async def get_user_activity(
    user_id: str,
    days: int = 7,
    current_user: dict = Depends(get_current_user),
):
    if user_id != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Can only view your own activity unless admin")
    return analytics_engine.get_user_activity(user_id, days=days)


@router.get("/module-metrics")
async def get_module_metrics(
    days: int = 7,
    current_user: dict = Depends(require_admin),
):
    return {"metrics": analytics_engine.get_module_metrics(days=days)}


@router.get("/my/costs")
async def get_my_costs(
    current_user: dict = Depends(get_current_user),
):
    return cost_tracker.get_user_summary(current_user["user_id"])


@router.get("/costs/provider-pricing")
async def get_provider_pricing(
    current_user: dict = Depends(require_admin),
):
    return {"pricing": cost_tracker.get_provider_costs()}


@router.get("/costs/system-wide")
async def get_system_costs(
    days: int = 7,
    current_user: dict = Depends(require_admin),
):
    return cost_tracker.get_system_wide_stats(days=days)


@router.get("/costs/providers")
async def get_provider_costs(
    current_user: dict = Depends(require_admin),
):
    return {"providers": cost_tracker.get_provider_metrics()}


@router.get("/realtime")
async def get_realtime(
    current_user: dict = Depends(require_admin),
):
    return analytics_engine.get_realtime_stats()


@router.get("/satisfaction")
async def get_satisfaction(
    user_id: Optional[str] = None,
    days: int = 7,
    current_user: dict = Depends(get_current_user),
):
    if user_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view other users' satisfaction")
    return analytics_engine.get_user_satisfaction(user_id or current_user["user_id"], days=days)


@router.get("/top-users")
async def get_top_users(
    days: int = 7,
    limit: int = 10,
    current_user: dict = Depends(require_admin),
):
    return {"top_users": analytics_engine.get_top_users(days=days, limit=limit)}


@router.get("/funnel")
async def get_funnel(
    funnel_name: str = "default",
    days: int = 7,
    current_user: dict = Depends(require_admin),
):
    return analytics_engine.get_funnel_analysis(funnel_name=funnel_name, days=days)


@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    current_user: dict = Depends(get_current_user),
):
    if feedback.rating < 1 or feedback.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    analytics_engine.record_user_feedback(current_user["user_id"], feedback.module, feedback.rating, feedback.feedback)
    return {"status": "success", "message": "Feedback recorded"}


@router.post("/track")
async def track_event(
    event: TrackEventRequest,
    current_user: dict = Depends(get_current_user),
):
    analytics_engine.track_event(
        event_type=event.event_type,
        user_id=current_user["user_id"],
        module=event.module,
        duration_ms=event.duration_ms,
        metadata=event.metadata,
    )
    return {"status": "success", "message": "Event tracked"}
