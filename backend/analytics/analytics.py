"""
SAM AI - Analytics Engine
Tracks user activity, module usage, performance metrics, and provides dashboards.
"""

import time
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from collections import defaultdict


@dataclass
class AnalyticsEvent:
    event_type: str
    user_id: str
    module: str
    entity_id: Optional[str]
    metadata: Dict[str, Any]
    duration_ms: float
    timestamp: datetime
    client_ip: Optional[str] = None


@dataclass
class ModuleMetric:
    module: str
    request_count: int
    avg_response_time_ms: float
    error_count: int
    user_satisfaction: Optional[float]
    peak_concurrent: int


class AnalyticsEngine:
    def __init__(self):
        self.events: List[AnalyticsEvent] = []
        self.max_events = 10000
        self.funnel_names = [
            "auth_start", "model_selected", "input_provided",
            "processing", "validation", "output_delivered", "feedback_given"
        ]
        self._event_buffer: Dict[str, List[AnalyticsEvent]] = defaultdict(list)

    def track_event(
        self,
        event_type: str,
        user_id: str,
        module: str,
        duration_ms: float = 0,
        metadata: Optional[Dict[str, Any]] = None,
        client_ip: Optional[str] = None,
        entity_id: Optional[str] = None,
    ):
        event = AnalyticsEvent(
            event_type=event_type,
            user_id=user_id,
            module=module,
            entity_id=entity_id,
            metadata=metadata or {},
            duration_ms=duration_ms,
            timestamp=datetime.utcnow(),
            client_ip=client_ip,
        )

        self.events.append(event)
        if len(self.events) > self.max_events:
            self.events = self.events[-5000:]

        # Buffer for batch processing
        self._event_buffer[event_type].append(event)
        if len(self._event_buffer[event_type]) > 100:
            self._event_buffer[event_type] = self._event_buffer[event_type][-50:]

    def get_user_activity(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        user_events = [e for e in self.events if e.user_id == user_id and e.timestamp >= cutoff]

        module_usage = defaultdict(int)
        event_counts = defaultdict(int)
        daily_activity = defaultdict(int)

        for e in user_events:
            module_usage[e.module] += 1
            event_counts[e.event_type] += 1
            daily_activity[e.timestamp.strftime("%Y-%m-%d")] += 1

        return {
            "user_id": user_id,
            "period_days": days,
            "total_events": len(user_events),
            "module_usage": dict(module_usage),
            "event_counts": dict(event_counts),
            "daily_activity": dict(daily_activity),
            "most_used_module": max(module_usage.items(), key=lambda x: x[1])[0] if module_usage else None,
        }

    def get_module_metrics(self, days: int = 7) -> List[Dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent_events = [e for e in self.events if e.timestamp >= cutoff]

        module_data = defaultdict(lambda: {
            "request_count": 0,
            "total_duration": 0,
            "error_count": 0,
            "durations": [],
        })

        for e in recent_events:
            data = module_data[e.module]
            data["request_count"] += 1
            if e.duration_ms > 0:
                data["durations"].append(e.duration_ms)
                data["total_duration"] += e.duration_ms
            if e.event_type in ("error", "failed"):
                data["error_count"] += 1

        results = []
        for module, data in module_data.items():
            durations = data["durations"] if data["durations"] else [0]
            avg_time = sum(durations) / len(durations)
            error_rate = (data["error_count"] / max(data["request_count"], 1)) * 100

            results.append({
                "module": module,
                "request_count": data["request_count"],
                "avg_response_time_ms": round(avg_time, 2),
                "error_count": data["error_count"],
                "error_rate_pct": round(error_rate, 2),
                "peak_concurrent": max(data["request_count"] // 10, 1),
            })

        return sorted(results, key=lambda x: x["request_count"], reverse=True)

    def get_system_dashboard(self, days: int = 7) -> Dict[str, Any]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent_events = [e for e in self.events if e.timestamp >= cutoff]

        total_events = len(recent_events)
        unique_users = len(set(e.user_id for e in recent_events))
        module_metrics = self.get_module_metrics(days)

        intent_distribution = defaultdict(int)
        for e in recent_events:
            intent_distribution[e.module] += 1

        return {
            "period_days": days,
            "total_events": total_events,
            "unique_users": unique_users,
            "active_modules": len(module_metrics),
            "module_popularity": {k: v["request_count"] for k, v in
                                  sorted(intent_distribution.items(), key=lambda x: x[1], reverse=True)},
            "module_metrics": module_metrics[:10],
            "top_modules": [m["module"] for m in module_metrics[:5]],
        }

    def get_user_satisfaction(self, user_id: str = None, days: int = 7) -> Dict[str, Any]:
        cutoff = datetime.utcnow() - timedelta(days=days)

        if user_id:
            events = [e for e in self.events if e.user_id == user_id and e.timestamp >= cutoff]
        else:
            events = [e for e in self.events if e.timestamp >= cutoff]

        feedback_events = [e for e in events if e.event_type == "feedback_given"]
        positive = len([e for e in feedback_events if e.metadata.get("rating", 0) >= 4])
        negative = len([e for e in feedback_events if e.metadata.get("rating", 0) < 4])

        total_feedback = len(feedback_events)
        avg_rating = (sum(e.metadata.get("rating", 0) for e in feedback_events) / max(total_feedback, 1))

        return {
            "total_feedback": total_feedback,
            "positive_count": positive,
            "negative_count": negative,
            "avg_rating": round(avg_rating, 2),
            "satisfaction_pct": round((positive / max(total_feedback, 1)) * 100, 2),
            "nps_score": round((positive - negative) / max(total_feedback, 1) * 100, 2),
        }

    def get_funnel_analysis(self, funnel_name: str = "default", days: int = 7) -> Dict[str, Any]:
        if funnel_name != "default":
            stages = [funnel_name]
        else:
            stages = self.funnel_names

        cutoff = datetime.utcnow() - timedelta(days=days)
        events = [e for e in self.events if e.timestamp >= cutoff]

        stage_counts = {}
        for stage in stages:
            stage_counts[stage] = len([e for e in events if e.event_type == stage])

        return {
            "funnel_name": funnel_name,
            "stages": stages,
            "stage_counts": stage_counts,
            "conversion_rates": {
                f"{stages[i]}": round(stage_counts.get(stages[i], 0) / max(stage_counts.get(stages[0], 1), 1) * 100, 2)
                for i in range(1, len(stages))
            } if stage_counts.get(stages[0], 0) > 0 else {},
        }

    def record_user_feedback(self, user_id: str, module: str, rating: int, feedback: str = None):
        self.track_event(
            "feedback_given", user_id, module,
            metadata={"rating": rating, "feedback": feedback or ""},
            duration_ms=0,
        )

    def record_error(self, user_id: str, module: str, error: str):
        self.track_event(
            "error", user_id, module,
            metadata={"error": error},
            duration_ms=0,
        )

    def get_top_users(self, days: int = 7, limit: int = 10) -> List[Dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        user_events = [e for e in self.events if e.timestamp >= cutoff]

        user_stats = defaultdict(lambda: {"events": 0, "modules": set(), "cost": 0})
        for e in user_events:
            user_stats[e.user_id]["events"] += 1
            user_stats[e.user_id]["modules"].add(e.module)

        sorted_users = sorted(user_stats.items(), key=lambda x: x[1]["events"], reverse=True)[:limit]
        return [
            {"user_id": uid, "events": data["events"], "modules_used": len(data["modules"])}
            for uid, data in sorted_users
        ]

    def get_realtime_stats(self) -> Dict[str, Any]:
        now = datetime.utcnow()
        last_minute = [e for e in self.events if e.timestamp >= now - timedelta(minutes=1)]
        last_5_min = [e for e in self.events if e.timestamp >= now - timedelta(minutes=5)]

        return {
            "requests_last_minute": len(last_minute),
            "requests_last_5_minutes": len(last_5_min),
            "requests_per_second": round(len(last_minute) / 60, 2) if last_minute else 0,
            "current_active_users": len(set(e.user_id for e in last_5_min)),
        }


analytics_engine = AnalyticsEngine()
