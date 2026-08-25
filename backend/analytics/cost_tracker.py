"""
SAM AI - Cost Tracker
Tracks API usage costs across providers, user-level billing, and cost projections.
"""

import time
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from collections import defaultdict
import os


@dataclass
class UsageRecord:
    user_id: str
    provider: str
    model: str
    module: str
    action: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    timestamp: datetime
    intent_category: str = "general"
    request_id: Optional[str] = None


@dataclass
class UserCostSummary:
    user_id: str
    total_cost_usd: float
    total_tokens: int
    providers_used: Dict[str, float]
    modules_used: Dict[str, float]
    daily_costs: Dict[str, float]
    current_period_cost: float
    projected_monthly_cost: float


@dataclass
class ProviderMetrics:
    provider: str
    total_requests: int
    total_cost_usd: float
    avg_latency_ms: float
    error_count: int
    success_rate: float
    uptime_pct: float


# Provider cost per 1M tokens (input / output)
PROVIDER_PRICING = {
    "openai": {
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "gpt-4-turbo": {"input": 0.001, "output": 0.003},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    },
    "gemini": {
        "gemini-1.5-pro": {"input": 0.0035, "output": 0.0105},
        "gemini-1.5-flash": {"input": 0.000075, "output": 0.0003},
        "gemini-2.0-flash": {"input": 0.000075, "output": 0.0003},
        "gemini-2.5-flash": {"input": 0.00015, "output": 0.0006},
    },
    "claude": {
        "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
        "claude-3-5-haiku-20241022": {"input": 0.0008, "output": 0.004},
        "claude-3-opus-20240229": {"input": 0.015, "output": 0.075},
    },
}

# Local/free providers have zero cost
FREE_PROVIDERS = ["ollama", "local", "lmstudio", "transformers"]


class CostTracker:
    def __init__(self):
        self.usage_records: List[UsageRecord] = []
        self.provider_metrics: Dict[str, ProviderMetrics] = {}
        self.max_records = 10000
        self._period_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def _estimate_cost(self, provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
        if provider.lower() in FREE_PROVIDERS:
            return 0.0

        pricing = PROVIDER_PRICING.get(provider.lower(), {})
        model_pricing = None
        for key, val in pricing.items():
            if model and key.lower() in model.lower():
                model_pricing = val
                break

        if not model_pricing:
            model_pricing = {"input": 0.001, "output": 0.002}

        input_cost = (input_tokens / 1_000_000) * model_pricing["input"]
        output_cost = (output_tokens / 1_000_000) * model_pricing["output"]
        return round(input_cost + output_cost, 8)

    def record_usage(
        self,
        user_id: str,
        provider: str,
        model: str,
        module: str,
        action: str,
        input_tokens: int,
        output_tokens: int,
        intent_category: str = "general",
        request_id: Optional[str] = None,
    ) -> float:
        cost_usd = self._estimate_cost(provider, model, input_tokens, output_tokens)

        record = UsageRecord(
            user_id=user_id,
            provider=provider,
            model=model,
            module=module,
            action=action,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost_usd,
            timestamp=datetime.utcnow(),
            intent_category=intent_category,
            request_id=request_id,
        )

        self.usage_records.append(record)
        if len(self.usage_records) > self.max_records:
            self.usage_records = self.usage_records[-5000:]

        if provider not in self.provider_metrics:
            self.provider_metrics[provider] = ProviderMetrics(
                provider=provider,
                total_requests=0,
                total_cost_usd=0.0,
                avg_latency_ms=0.0,
                error_count=0,
                success_rate=100.0,
                uptime_pct=100.0,
            )

        self.provider_metrics[provider].total_requests += 1
        self.provider_metrics[provider].total_cost_usd += cost_usd

        return cost_usd

    def get_user_summary(self, user_id: str) -> UserCostSummary:
        user_records = [r for r in self.usage_records if r.user_id == user_id]

        total_cost = sum(r.cost_usd for r in user_records)
        total_tokens = sum(r.input_tokens + r.output_tokens for r in user_records)
        providers = defaultdict(float)
        modules = defaultdict(float)
        daily = defaultdict(float)

        for r in user_records:
            providers[r.provider] += r.cost_usd
            modules[r.module] += r.cost_usd
            day_key = r.timestamp.strftime("%Y-%m-%d")
            daily[day_key] += r.cost_usd

        current_period_records = [
            r for r in user_records
            if r.timestamp >= self._period_start
        ]
        current_period_cost = sum(r.cost_usd for r in current_period_records)

        # Project monthly: extrapolate from daily average
        days_in_period = max((datetime.utcnow() - self._period_start).days, 1)
        daily_avg = current_period_cost / days_in_period
        projected_monthly = round(daily_avg * 30, 2)

        return UserCostSummary(
            user_id=user_id,
            total_cost_usd=round(total_cost, 6),
            total_tokens=total_tokens,
            providers_used={k: round(v, 6) for k, v in dict(providers).items()},
            modules_used={k: round(v, 6) for k, v in dict(modules).items()},
            daily_costs={k: round(v, 6) for k, v in dict(daily).items()},
            current_period_cost=round(current_period_cost, 6),
            projected_monthly_cost=projected_monthly,
        )

    def get_provider_metrics(self) -> List[Dict[str, Any]]:
        return [
            {
                "provider": m.provider,
                "total_requests": m.total_requests,
                "total_cost_usd": round(m.total_cost_usd, 4),
                "avg_latency_ms": round(m.avg_latency_ms, 2),
                "error_count": m.error_count,
                "success_rate": round(m.success_rate, 2),
                "uptime_pct": round(m.uptime_pct, 2),
            }
            for m in self.provider_metrics.values()
        ]

    def record_error(self, provider: str):
        if provider in self.provider_metrics:
            self.provider_metrics[provider].error_count += 1
            total = self.provider_metrics[provider].total_requests
            errors = self.provider_metrics[provider].error_count
            if total > 0:
                self.provider_metrics[provider].success_rate = round(((total - errors) / total) * 100, 2)

    def record_latency(self, provider: str, latency_ms: float):
        if provider in self.provider_metrics:
            current_avg = self.provider_metrics[provider].avg_latency_ms
            current_count = self.provider_metrics[provider].total_requests
            if current_count > 0:
                new_avg = (current_avg * (current_count - 1) + latency_ms) / current_count
            else:
                new_avg = latency_ms
            self.provider_metrics[provider].avg_latency_ms = round(new_avg, 2)

    def get_system_wide_stats(self, days: int = 7) -> Dict[str, Any]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent = [r for r in self.usage_records if r.timestamp >= cutoff]

        total_cost = sum(r.cost_usd for r in recent)
        total_tokens = sum(r.input_tokens + r.output_tokens for r in recent)
        total_requests = len(recent)

        costs_by_module = defaultdict(float)
        costs_by_provider = defaultdict(float)
        costs_by_intent = defaultdict(float)
        costs_by_day = defaultdict(float)

        for r in recent:
            costs_by_module[r.module] += r.cost_usd
            costs_by_provider[r.provider] += r.cost_usd
            costs_by_intent[r.intent_category] += r.cost_usd
            costs_by_day[r.timestamp.strftime("%Y-%m-%d")] += r.cost_usd

        return {
            "period_days": days,
            "total_requests": total_requests,
            "total_cost_usd": round(total_cost, 6),
            "total_tokens": total_tokens,
            "costs_by_module": {k: round(v, 6) for k, v in dict(costs_by_module).items()},
            "costs_by_provider": {k: round(v, 6) for k, v in dict(costs_by_provider).items()},
            "costs_by_intent": {k: round(v, 6) for k, v in dict(costs_by_intent).items()},
            "costs_by_day": {k: round(v, 6) for k, v in sorted(dict(costs_by_day).items())},
            "avg_cost_per_request": round(total_cost / max(total_requests, 1), 6),
        }

    def get_provider_costs(self) -> Dict[str, Any]:
        provider_costs = {}
        for provider, pricing in PROVIDER_PRICING.items():
            provider_costs[provider] = pricing
        for fp in FREE_PROVIDERS:
            provider_costs[fp] = {"note": "Free/local - no cost"}
        return provider_costs


cost_tracker = CostTracker()
