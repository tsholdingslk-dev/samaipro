from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from database import get_db
from security import get_current_user, require_admin
from validators.output_validator import validation_pipeline, CheckType
from validators.safety_guard import safety_guard
from validators.fact_checker import fact_checker
from validators.schema_validator import schema_validator, SchemaIssue

router = APIRouter(
    prefix="/validation",
    tags=["Validation Layer"]
)


class ValidateRequest(BaseModel):
    output: str
    intent_category: str = "general"
    module: str = "general"
    schema: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None
    auto_repair: Optional[bool] = False


class SafeExecuteRequest(BaseModel):
    task_description: str
    intent_category: str = "general"
    module: str = "general"
    schema: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None
    max_repairs: Optional[int] = 3


@router.post("/validate")
async def validate_output(
    request: ValidateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Validate AI output for safety, schema, facts, and completeness."""
    from validators.retry_handler import retry_handler

    async def simple_validation_fn(output, intent, schema=None, context=None):
        return await validation_pipeline.validate(output, intent, module=request.module, schema=schema, context=context)

    async def simple_repair_fn(prompt, original, ctx=None):
        from api_hub import api_hub
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Original output:\n{original}\n\nFix the issues."},
        ]
        result = await api_hub.chat(messages, temperature=0.5)
        return result["content"]

    if request.auto_repair:
        from validators.retry_handler import RepairConfig
        config = RepairConfig(max_attempts=request.max_repairs if hasattr(request, 'max_repairs') else 3)
        result = await retry_handler.validate_with_retry(
            initial_output=request.output,
            validation_fn=simple_validation_fn,
            repair_fn=simple_repair_fn,
            intent_category=request.intent_category,
            schema=request.schema,
            context=request.context,
            config=config,
        )
        return {
            "success": result.success,
            "output": result.final_output,
            "attempts": result.attempts,
            "issues_fixed": result.issues_fixed,
            "failure_reason": result.failure_reason,
        }
    else:
        result = await validation_pipeline.validate(
            request.output, request.intent_category,
            module=request.module, schema=request.schema, context=request.context,
        )
        return {
            "passed": result.passed,
            "final_status": result.final_status,
            "confidence": result.confidence,
            "issues": [{"check_type": i.check_type.value if hasattr(i, 'check_type') else 'unknown',
                        "severity": i.severity, "message": i.message} for i in result.issues],
            "checks_performed": result.checks_performed,
            "repairs_applied": result.repairs_applied,
            "output": result.output,
        }


@router.post("/safe-execute")
async def safe_execute(
    request: SafeExecuteRequest,
    current_user: dict = Depends(get_current_user),
):
    """Execute a task with automatic validation and auto-repair."""
    from orchestrator.task_router import task_router

    async def execution_fn(task_desc, ctx):
        return await task_router.route_task(task_desc, ctx or {})

    async def repair_fn(prompt, original, ctx=None):
        from api_hub import api_hub
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Previous output:\n{original[:5000]}\n\nFix validation issues."},
        ]
        result = await api_hub.chat(messages, temperature=0.5)
        return result["content"]

    from validators.retry_handler import retry_handler, RepairConfig
    from validators.output_validator import validation_pipeline

    async def validation_fn(output, intent, schema=None, context=None):
        return await validation_pipeline.validate(output, intent, module=request.module, schema=schema, context=context)

    from agents import agent_executor
    agent_result = await execution_fn(request.task_description, request.context)
    task_desc = agent_result.get("result", "")

    retry_result = await retry_handler.validate_with_retry(
        initial_output=task_desc,
        validation_fn=validation_fn,
        repair_fn=repair_fn,
        intent_category=request.intent_category,
        schema=request.schema,
        context=request.context,
        config=RepairConfig(max_attempts=request.max_repairs),
    )

    agent_result["result"] = retry_result.final_output
    agent_result["validation"] = {
        "attempts": retry_result.attempts,
        "issues_fixed": retry_result.issues_fixed,
        "success": retry_result.success,
        "failure_reason": retry_result.failure_reason,
    }

    return agent_result


@router.get("/stats")
async def get_validator_stats(
    current_user: dict = Depends(require_admin),
):
    from validators.retry_handler import retry_handler
    return retry_handler.get_stats()


@router.post("/safety-check")
async def safety_check(
    text: str = Body(..., embed=True),
    intent_category: str = Body("general", embed=True),
    current_user: dict = Depends(get_current_user),
):
    result = safety_guard.check(text, intent_category)
    return {
        "passed": result.passed,
        "confidence": result.confidence,
        "flags": result.flags,
        "issues": [{"severity": i.severity, "category": i.category, "message": i.message} for i in result.issues],
    }


@router.post("/schema-detect")
async def detect_schema(
    intent_category: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
):
    schema = schema_validator.auto_detect_schema(intent_category)
    if schema:
        return {"detected": True, "schema": schema}
    return {"detected": False, "message": "No known schema for this category"}


@router.post("/fact-check")
async def fact_check_text(
    text: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await fact_checker.check(text)
    return {
        "passed": result.passed,
        "confidence": result.confidence,
        "checked_claims": result.checked_claims,
        "verified_claims": result.verified_claims,
        "issues": [{"severity": i.severity, "claim": i.claim, "message": i.message} for i in result.issues],
    }
