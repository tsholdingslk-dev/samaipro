"""
SAM AI - Model Selector
Chooses the best AI model/provider based on task complexity, cost tier, and provider availability.
Implements cost-based routing: easy→cheap, medium→standard, hard→premium.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import defaultdict
import statistics


@dataclass
class ModelSelection:
    provider_name: str
    model: str
    base_url: str
    priority: int
    cost_multiplier: float
    reasoning: str


@dataclass
class ProviderMetrics:
    provider_name: str
    model: str
    total_requests: int = 0
    failed_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    avg_latency_ms: float = 0.0
    last_error: Optional[str] = None
    last_used: Optional[datetime] = None
    consecutive_failures: int = 0
    cooldown_until: Optional[datetime] = None


class ModelSelector:
    def __init__(self):
        self.metrics: Dict[str, ProviderMetrics] = defaultdict(ProviderMetrics)
        self.cooldown_duration = timedelta(minutes=5)
        self.frequent_failure_threshold = 3

    _MODEL_TIER_GROUPS = {
        "cheap": {
            "models": ["gpt-3.5-turbo", "gpt-4o-mini", "gemini-1.5-flash", "gemini-2.5-flash",
                       "llama-3.3-70b-versatile", "deepseek-chat", "Qwen2.5-72B-Instruct"],
            "description": "Fast, cost-efficient models for simple tasks"
        },
        "standard": {
            "models": ["gpt-4", "gpt-4o", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-2.5-pro",
                       "claude-3-5-sonnet", "claude-3-7-sonnet", "deepseek-v4-flash", "Qwen2.5-Coder-32B-Instruct"],
            "description": "Balanced performance for medium-complexity tasks"
        },
        "premium": {
            "models": ["gpt-4-turbo", "gpt-4o", "gemini-2.5-pro", "claude-3-opus", "claude-3-7-sonnet",
                       "o1-preview", "o1-mini"],
            "description": "High-capability models for complex tasks"
        }
    }

    def _map_model_to_tier(self, model_name: str) -> str:
        model_lower = model_name.lower()
        for tier, group in self._MODEL_TIER_GROUPS.items():
            for m in group["models"]:
                if m.lower() in model_lower or model_lower in m.lower():
                    return tier
        return "standard"

    def _is_provider_available(self, provider) -> bool:
        now = datetime.utcnow()
        metrics = self.metrics.get(provider.name)

        if metrics and metrics.cooldown_until and metrics.cooldown_until > now:
            return False

        if metrics and metrics.consecutive_failures >= self.frequent_failure_threshold:
            if metrics.cooldown_until and metrics.cooldown_until <= now:
                metrics.consecutive_failures = 0
                metrics.cooldown_until = None
            else:
                return False

        return provider.is_available()

    def _rank_providers(self, providers: List[Any], complexity: str, cost_tier: str) -> List[tuple]:
        ranked = []
        for provider in providers:
            if not self._is_provider_available(provider):
                continue

            model_tier = self._map_model_to_tier(provider.model)
            score = 0.0
            reasons = []

            if complexity == "high":
                tier_order = {"premium": 3, "standard": 1, "cheap": 0}
                score += tier_order.get(model_tier, 1) * 10
                reasons.append(f"complexity={complexity} favors {model_tier} models")
            elif complexity == "medium":
                if model_tier == "standard":
                    score += 10
                    reasons.append("standard tier optimal for medium complexity")
                elif model_tier == "premium":
                    score += 5
                    reasons.append("premium can handle medium complexity well")
                elif model_tier == "cheap":
                    score -= 3
                    reasons.append("cheap model may lack depth for medium complexity")
            elif complexity == "low":
                if model_tier == "cheap":
                    score += 10
                    reasons.append("cheap model optimal for simple tasks (cost savings)")
                elif model_tier == "standard":
                    score += 5
                    reasons.append("standard model fine for simple tasks")
                elif model_tier == "premium":
                    score -= 10
                    reasons.append("premium overkill for simple tasks (cost penalty)")

            if cost_tier == "premium":
                if model_tier == "premium":
                    score += 3
                elif model_tier == "cheap":
                    score -= 5
            elif cost_tier == "free":
                if model_tier == "cheap":
                    score += 3
                elif model_tier == "premium":
                    score -= 8

            metrics = self.metrics.get(provider.name)
            if metrics:
                if metrics.avg_latency_ms > 0:
                    latency_score = max(0, 5 - (metrics.avg_latency_ms / 200))
                    score += latency_score * 0.5
                    reasons.append(f"latency={metrics.avg_latency_ms:.0f}ms")

                if metrics.total_requests > 0:
                    success_rate = (metrics.total_requests - metrics.failed_requests) / metrics.total_requests
                    score += success_rate * 5
                    reasons.append(f"success_rate={success_rate:.1%}")

                if metrics.last_used:
                    time_factor = max(0, 1 - (datetime.utcnow() - metrics.last_used).total_seconds() / 3600)
                    score -= time_factor * 2

            provider_priority = provider.priority
            score += max(0, 5 - provider_priority)

            ranked.append((score, provider, reasons))

        ranked.sort(key=lambda x: x[0], reverse=True)
        return ranked

    def select_model(self, complexity: str, cost_tier: str, providers: List[Any] = None) -> Optional[ModelSelection]:
        if providers is None:
            from api_hub import api_hub
            providers = api_hub.get_available_providers()

        ranked = self._rank_providers(providers, complexity, cost_tier)

        if not ranked:
            return None

        best_score, best_provider, reasons = ranked[0]
        cost_map = {"cheap": 1.0, "standard": 3.0, "premium": 10.0}
        cost_multiplier = cost_map.get(self._map_model_to_tier(best_provider.model), 3.0)

        return ModelSelection(
            provider_name=best_provider.name,
            model=best_provider.model,
            base_url=best_provider.base_url,
            priority=best_provider.priority,
            cost_multiplier=cost_multiplier,
            reasoning=" | ".join(reasons) if reasons else "Selected based on ranking"
        )

    def select_with_fallback(self, complexity: str, cost_tier: str, providers: List[Any] = None, max_fallbacks: int = 2) -> List[ModelSelection]:
        if providers is None:
            from api_hub import api_hub
            providers = api_hub.get_available_providers()

        ranked = self._rank_providers(providers, complexity, cost_tier)

        selections = []
        for i, (score, provider, reasons) in enumerate(ranked[:max_fallbacks + 1]):
            cost_map = {"cheap": 1.0, "standard": 3.0, "premium": 10.0}
            cost_multiplier = cost_map.get(self._map_model_to_tier(provider.model), 3.0)

            role = "primary" if i == 0 else f"fallback_{i}"
            selections.append(ModelSelection(
                provider_name=provider.name,
                model=provider.model,
                base_url=provider.base_url,
                priority=provider.priority,
                cost_multiplier=cost_multiplier,
                reasoning=f"[{role}] " + (" | ".join(reasons) if reasons else "Ranking-based selection")
            ))

        return selections

    def record_success(self, provider_name: str, latency_ms: float = 0, tokens: int = 0, cost: float = 0):
        metrics = self.metrics[provider_name]
        metrics.total_requests += 1
        metrics.avg_latency_ms = (metrics.avg_latency_ms * (metrics.total_requests - 1) + latency_ms) / metrics.total_requests
        metrics.total_tokens += tokens
        metrics.total_cost += cost
        metrics.last_used = datetime.utcnow()
        metrics.consecutive_failures = 0
        metrics.last_error = None

    def record_failure(self, provider_name: str, error: str):
        metrics = self.metrics[provider_name]
        metrics.total_requests += 1
        metrics.failed_requests += 1
        metrics.consecutive_failures += 1
        metrics.last_error = error
        metrics.last_used = datetime.utcnow()

        if metrics.consecutive_failures >= self.frequent_failure_threshold:
            metrics.cooldown_until = datetime.utcnow() + self.cooldown_duration

    def get_provider_stats(self) -> List[Dict[str, Any]]:
        stats = []
        for name, m in self.metrics.items():
            success_rate = 0
            if m.total_requests > 0:
                success_rate = ((m.total_requests - m.failed_requests) / m.total_requests) * 100
            stats.append({
                "provider": name,
                "total_requests": m.total_requests,
                "failed_requests": m.failed_requests,
                "success_rate": round(success_rate, 2),
                "avg_latency_ms": round(m.avg_latency_ms, 2),
                "total_tokens": m.total_tokens,
                "total_cost": round(m.total_cost, 4),
                "consecutive_failures": m.consecutive_failures,
                "last_error": m.last_error,
                "cooldown_until": m.cooldown_until.isoformat() if m.cooldown_until else None,
            })
        return stats

    def reset_cooldowns(self):
        now = datetime.utcnow()
        for name, m in self.metrics.items():
            if m.cooldown_until and m.cooldown_until <= now:
                m.cooldown_until = None
                m.consecutive_failures = 0


model_selector = ModelSelector()
