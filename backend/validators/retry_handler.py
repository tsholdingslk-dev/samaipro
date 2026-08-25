"""
SAM AI - Retry Handler
Manages retry/repair loops for AI outputs that fail validation.
Implements exponential backoff and adaptive prompt repair.
"""

import time
import json
from typing import Dict, Any, List, Optional, Callable, Awaitable
from dataclasses import dataclass, field


@dataclass
class RetryResult:
    success: bool
    final_output: str
    attempts: int
    total_repair_time_ms: float
    issues_fixed: int
    failure_reason: Optional[str] = None


@dataclass
class RepairConfig:
    max_attempts: int = 3
    backoff_base: float = 1.0
    backoff_multiplier: float = 2.0
    max_backoff: float = 30.0
    repair_prompt_template: str = """
The previous output failed validation with these issues:
{issues}

Please fix these issues and provide corrected output.
Keep the same overall structure and content, only fixing the problems identified.
"""


class RetryHandler:
    def __init__(self):
        self.default_config = RepairConfig()
        self.stats: Dict[str, Any] = {"total_attempts": 0, "successful_repairs": 0, "failures": 0}

    async def validate_with_retry(
        self,
        initial_output: str,
        validation_fn: Callable,
        repair_fn: Callable,
        intent_category: str = "general",
        schema: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        config: Optional[RepairConfig] = None,
    ) -> RetryResult:
        config = config or self.default_config
        start_time = time.time()
        current_output = initial_output
        attempts = 0
        issues_fixed = 0

        result = await validation_fn(initial_output, intent_category, schema=schema, context=context)

        if result.passed and result.final_status not in ("needs_repair", "failed", "warning"):
            return RetryResult(
                success=True,
                final_output=current_output,
                attempts=0,
                total_repair_time_ms=0,
                issues_fixed=0,
            )

        while attempts < config.max_attempts:
            attempts += 1
            self.stats["total_attempts"] += 1

            issues_summary = "; ".join(
                f"{i.check_type.value}: {i.message}"
                for i in result.issues
                if hasattr(i, 'check_type') and i.severity in ("error", "critical")
            ) or "; ".join(i.message for i in result.issues)

            repair_prompt = config.repair_prompt_template.format(issues=issues_summary or "Validation issues")

            backoff = min(
                config.backoff_base * (config.backoff_multiplier ** (attempts - 1)),
                config.max_backoff,
            )
            if attempts > 1:
                time.sleep(min(backoff, 2.0))

            try:
                current_output = await repair_fn(repair_prompt, current_output, context)
            except Exception as e:
                self.stats["failures"] += 1
                return RetryResult(
                    success=False,
                    final_output=current_output,
                    attempts=attempts,
                    total_repair_time_ms=round((time.time() - start_time) * 1000, 2),
                    issues_fixed=issues_fixed,
                    failure_reason=f"Repair function error: {str(e)}",
                )

            prev_issue_count = len(result.issues)
            result = await validation_fn(current_output, intent_category, schema=schema, context=context)

            new_issue_count = len(result.issues)
            if new_issue_count < prev_issue_count:
                issues_fixed += prev_issue_count - new_issue_count

            if result.passed and result.final_status not in ("needs_repair", "failed"):
                self.stats["successful_repairs"] += 1
                return RetryResult(
                    success=True,
                    final_output=current_output,
                    attempts=attempts,
                    total_repair_time_ms=round((time.time() - start_time) * 1000, 2),
                    issues_fixed=issues_fixed,
                )

        self.stats["failures"] += 1
        return RetryResult(
            success=False,
            final_output=current_output,
            attempts=attempts,
            total_repair_time_ms=round((time.time() - start_time) * 1000, 2),
            issues_fixed=issues_fixed,
            failure_reason=f"Failed after {attempts} attempts: {'; '.join(i.message for i in result.issues)}",
        )

    async def safe_execute(
        self,
        execution_fn: Callable,
        task_description: str,
        intent_category: str = "general",
        schema: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        validation_fn: Optional[Callable] = None,
        config: Optional[RepairConfig] = None,
    ) -> Dict[str, Any]:
        config = config or self.default_config

        try:
            result = await execution_fn(task_description, context)
        except Exception as e:
            return {
                "status": "failed",
                "result": f"Execution failed: {str(e)}",
                "task_description": task_description,
            }

        output = result.get("result", "")
        metadata = result.get("metadata", {})

        if validation_fn:
            async def repair_fn(prompt: str, original: str, ctx: Optional[Dict] = None) -> str:
                messages = [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Original output:\n{original}"},
                ]
                from api_hub import api_hub
                repair_result = await api_hub.chat(messages, temperature=0.5)
                return repair_result["content"]

            retry_result = await self.validate_with_retry(
                initial_output=output,
                validation_fn=validation_fn,
                repair_fn=repair_fn,
                intent_category=intent_category,
                schema=schema,
                context=context,
                config=config,
            )

            return {
                "status": "completed" if retry_result.success else "failed",
                "result": retry_result.final_output,
                "task_description": task_description,
                "agent_used": result.get("agent_used"),
                "validation": {
                    "attempts": retry_result.attempts,
                    "issues_fixed": retry_result.issues_fixed,
                    "repair_time_ms": retry_result.total_repair_time_ms,
                    "failure_reason": retry_result.failure_reason,
                },
                "metadata": metadata,
            }

        return result

    def get_stats(self) -> Dict[str, Any]:
        return {
            **self.stats,
            "success_rate": round(
                (self.stats["successful_repairs"] / max(self.stats["total_attempts"], 1)) * 100, 2
            ),
        }


retry_handler = RetryHandler()
