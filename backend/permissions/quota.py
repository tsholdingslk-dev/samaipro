"""
SAM AI - Quota Manager
Tracks daily/monthly usage quotas per user/module/action.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from dataclasses import dataclass
from sqlalchemy.orm import Session
import models


@dataclass
class QuotaCheckResult:
    allowed: bool
    user_id: str
    module: str
    action: str
    current_count: int
    limit: int
    remaining: int
    reset_at: datetime
    denial_reason: str = None


class QuotaManager:
    def __init__(self):
        self.daily_quotas: Dict[str, int] = {}
        self.monthly_quotas: Dict[str, int] = {}
        self._default_daily = 1000
        self._default_monthly = 10000

    def check_quota(
        self,
        db: Session,
        user_id: str,
        module: str,
        action: str = "read",
    ) -> QuotaCheckResult:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        quota = db.query(models.UsageQuota).filter(
            models.UsageQuota.user_id == user_id,
            models.UsageQuota.module == module,
            models.UsageQuota.action == action,
            models.UsageQuota.date >= today,
        ).first()

        limit = quota.limit if quota and quota.limit > 0 else self._default_daily
        count = quota.count if quota else 0
        remaining = max(0, limit - count)
        reset_at = today + timedelta(days=1)

        allowed = count < limit

        return QuotaCheckResult(
            allowed=allowed,
            user_id=user_id,
            module=module,
            action=action,
            current_count=count,
            limit=limit,
            remaining=remaining,
            reset_at=reset_at,
            denial_reason=None if allowed else f"Daily quota ({limit}) exceeded. Resets at {reset_at.isoformat()}",
        )

    def increment_quota(self, db: Session, user_id: str, module: str, action: str = "read") -> int:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        quota = db.query(models.UsageQuota).filter(
            models.UsageQuota.user_id == user_id,
            models.UsageQuota.module == module,
            models.UsageQuota.action == action,
            models.UsageQuota.date >= today,
        ).first()

        if quota:
            quota.count += 1
            db.commit()
            return quota.count
        else:
            new_quota = models.UsageQuota(
                user_id=user_id,
                module=module,
                action=action,
                date=today,
                count=1,
                limit=self._get_default_limit(user_id, module, action),
            )
            db.add(new_quota)
            db.commit()
            return 1

    def _get_default_limit(self, user_id: str, module: str, action: str) -> int:
        user = db_query_first(user_id)
        if user and user.role == "admin":
            return 0  # unlimited

        role_limits = {
            "staff": {"image": 50, "video": 20, "agents": 100, "translate": 200, "chat": 500, "coding": 100, "default": 300},
            "student": {"image": 10, "video": 5, "agents": 20, "translate": 50, "chat": 200, "coding": 30, "default": 100},
            "teacher": {"image": 20, "video": 10, "agents": 50, "translate": 100, "chat": 300, "coding": 50, "default": 200},
            "creator": {"image": 50, "video": 30, "agents": 100, "translate": 100, "chat": 400, "coding": 80, "default": 300},
            "admin": {"default": 0},
        }

        if user:
            limits = role_limits.get(user.role, role_limits["student"])
            return limits.get(module, limits.get("default", 100))

        return self._default_daily

    def set_quota_limit(self, db: Session, user_id: str, module: str, action: str, limit: int, days: int = 1):
        now = datetime.utcnow()
        for i in range(days):
            day = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=i)
            quota = db.query(models.UsageQuota).filter(
                models.UsageQuota.user_id == user_id,
                models.UsageQuota.module == module,
                models.UsageQuota.action == action,
                models.UsageQuota.date >= day,
                models.UsageQuota.date < day + timedelta(days=1),
            ).first()

            if quota:
                quota.limit = limit
            else:
                quota = models.UsageQuota(
                    user_id=user_id,
                    module=module,
                    action=action,
                    date=day,
                    count=0,
                    limit=limit,
                )
                db.add(quota)

        db.commit()

    def get_user_quota_summary(self, db: Session, user_id: str) -> Dict[str, Any]:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        quotas = db.query(models.UsageQuota).filter(
            models.UsageQuota.user_id == user_id,
            models.UsageQuota.date >= today,
        ).all()

        total_used = sum(q.count for q in quotas)
        total_limit = sum(q.limit for q in quotas if q.limit > 0)

        return {
            "user_id": user_id,
            "total_used": total_used,
            "total_limit": total_limit if total_limit > 0 else "unlimited",
            "usage_percentage": round((total_used / total_limit) * 100, 1) if total_limit > 0 else 0,
            "quotas": [
                {
                    "module": q.module,
                    "action": q.action,
                    "count": q.count,
                    "limit": q.limit if q.limit > 0 else "unlimited",
                    "remaining": max(0, q.limit - q.count) if q.limit > 0 else "unlimited",
                }
                for q in quotas
            ],
        }


def db_query_first(user_id: str):
    try:
        from database import SessionLocal
        db = SessionLocal()
        user = db.query(models.User).filter(models.User.id == user_id).first()
        db.close()
        return user
    except Exception:
        return None


quota_manager = QuotaManager()
