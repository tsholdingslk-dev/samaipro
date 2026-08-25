"""
SAM AI Core
The central orchestration layer that ties together all 14 components:
Understanding → Planning → Execution → Validation → Learning

This is the brain that decides WHY, WHAT, and HOW to execute a task.
"""

import time
import uuid
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, AsyncGenerator
from dataclasses import dataclass, field
from enum import Enum


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class SamTask:
    id: str
    description: str
    intent_category: str
    module: str
    priority: TaskPriority
    user_id: str
    context: Dict[str, Any]
    estimated_cost: float
    dependencies: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    deadline: Optional[datetime] = None


@dataclass
class ExecutionPlan:
    steps: List[Dict[str, Any]]
    agents_involved: List[str]
    estimated_time_ms: float
    estimated_cost: float
    risk_level: str
    required_permissions: List[str]


@dataclass
class SamAIResponse:
    task_id: str
    status: str
    understanding: Dict[str, Any]
    plan: ExecutionPlan
    result: str
    citations: List[Dict[str, Any]]
    confidence: float
    execution_trace: List[str]
    metadata: Dict[str, Any]
    total_execution_time_ms: float


class SamAICore:
    def __init__(self):
        self._initialized = False
        self.conversation_history: Dict[str, List[Dict]] = {}
        self._feedback_cache: Dict[str, int] = {}

    def initialize(self):
        if self._initialized:
            return
        from orchestrator.task_router import task_router
        from agents import agent_executor
        task_router.register_executor(agent_executor)
        self._initialized = True

    async def understand(self, task_description: str, context: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        from orchestrator.task_router import task_router
        intent_result = task_router.classify_intent(task_description)
        return {
            "intent_category": intent_result["category"],
            "confidence": intent_result["confidence"],
            "module": intent_result["module"],
            "model": task_router.select_model(intent_result["category"], user_id),
            "requires_research": intent_result["category"] in ("research", "knowledge"),
            "requires_code": intent_result["category"] in ("coding", "flutter_build", "automation"),
            "requires_multimodal": intent_result["category"] in ("image_generation", "vision", "voice"),
        }

    async def plan(self, task_description: str, understanding: Dict[str, Any], context: Dict[str, Any]) -> ExecutionPlan:
        from orchestrator.task_router import task_router

        steps = []
        agents = []
        est_time = 2000.0
        est_cost = 0.005
        risk = "low"
        permissions = []

        if understanding["requires_research"]:
            steps.append({"step": 1, "action": "web_research", "agent": "NewsAgent", "description": "Research the topic"})
            agents.append("NewsAgent")
            est_time += 5000
            est_cost += 0.02
            risk = "medium"
            permissions.append("research:")

        steps.append({"step": len(steps) + 1, "action": "process", "agent": understanding["module"], "description": task_description})
        agents.append(understanding["module"])
        est_time += 3000
        est_cost += 0.01

        if understanding["requires_code"]:
            steps.append({"step": len(steps) + 1, "action": "validate", "agent": "Validator", "description": "Validate code output"})
            agents.append("Validator")
            est_time += 2000
            risk = "high"
            permissions.append("coding:")

        if understanding["requires_multimodal"]:
            est_cost += 0.05
            est_time += 3000
            risk = "medium"

        permissions.append(f"model:{understanding['model']['provider']}")

        return ExecutionPlan(
            steps=steps,
            agents_involved=list(set(agents)),
            estimated_time_ms=est_time,
            estimated_cost=round(est_cost, 4),
            risk_level=risk,
            required_permissions=permissions,
        )

    async def execute(self, task: SamTask) -> SamAIResponse:
        start_time = time.time()

        if not self._initialized:
            self.initialize()

        trace = []
        trace.append(f"Understanding task: {task.description[:80]}")
        understanding = await self.understand(task.description, task.context, task.user_id)
        trace.append(f"Intent: {understanding['intent_category']} (confidence: {understanding['confidence']})")

        plan = await self.plan(task.description, understanding, task.context)
        trace.append(f"Plan created: {len(plan.steps)} steps, agents: {', '.join(plan.agents_involved)}")

        from orchestrator.task_router import task_router
        from validators.output_validator import validation_pipeline
        from validators.retry_handler import retry_handler, RepairConfig
        from analytics.cost_tracker import cost_tracker
        from analytics.analytics import analytics_engine

        # Execute the task
        execution_context = dict(task.context)
        execution_context["intent_category"] = understanding["intent_category"]

        # Add research context if needed
        if understanding["requires_research"]:
            from knowledge.web_research_engine import web_research_engine
            trace.append("Conducting web research")
            research_result = await web_research_engine.research(task.description, num_sources=3)
            execution_context["research_context"] = research_result.synthesized_answer
            execution_context["research_sources"] = [
                {"url": s.url, "title": s.title, "reliability": s.reliability_score}
                for s in research_result.sources
            ]
            trace.append(f"Research complete: {len(execution_context['research_sources'])} sources found")

        # Check permissions
        from permissions.engine import permission_engine
        from database import SessionLocal
        db = SessionLocal()
        perm_result = permission_engine.check_permission(
            db, task.user_id, understanding["module"], "execute"
        )
        db.close()

        if not perm_result.allowed:
            trace.append(f"Permission denied: {perm_result.denial_reason}")
            return SamAIResponse(
                task_id=task.id,
                status="permission_denied",
                understanding=understanding,
                plan=plan,
                result=f"Permission denied: {perm_result.denial_reason}",
                citations=[],
                confidence=0.0,
                execution_trace=trace,
                metadata={"permission_result": {"allowed": False, "denial_reason": perm_result.denial_reason}},
                total_execution_time_ms=round((time.time() - start_time) * 1000, 2),
            )

        # Execute with validation and retry
        from agents import agent_executor
        result = await agent_executor.execute(task.description, execution_context)

        trace.append(f"Executed by {result.get('agent_used', 'unknown')}")

        # Validate output
        validation = await validation_pipeline.validate(
            result.get("result", ""),
            understanding["intent_category"],
            module=understanding["module"],
            context=execution_context,
        )
        trace.append(f"Validation: {'passed' if validation.passed else 'needs repair'} (confidence: {validation.confidence})")

        # Record metrics
        duration = result.get("execution_time", 0)
        input_tokens = len(task.description.split())
        output_tokens = len(result.get("result", "").split())
        cost = cost_tracker.record_usage(
            user_id=task.user_id,
            provider=result.get("metadata", {}).get("provider", "unknown"),
            model=understanding["model"]["model"],
            module=understanding["module"],
            action=task.intent_category,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            intent_category=understanding["intent_category"],
        )

        analytics_engine.track_event(
            "processing", task.user_id, understanding["module"],
            duration_ms=duration * 1000, metadata={"cost_usd": cost}
        )

        citations = execution_context.get("research_sources", [])

        return SamAIResponse(
            task_id=task.id,
            status=result.get("status", "completed"),
            understanding={
                "intent_category": understanding["intent_category"],
                "confidence": understanding["confidence"],
                "module": understanding["module"],
                "model": understanding["model"],
                "requires_research": understanding["requires_research"],
                "requires_code": understanding["requires_code"],
            },
            plan=plan,
            result=result.get("result", ""),
            citations=citations,
            confidence=round((validation.confidence + understanding["confidence"]) / 2, 3),
            execution_trace=trace,
            metadata={
                "agent_used": result.get("agent_used"),
                "steps_completed": result.get("steps_completed", []),
                "validation": {
                    "passed": validation.passed,
                    "confidence": validation.confidence,
                    "issues": len(validation.issues),
                },
                "cost_usd": cost,
                "model_info": understanding["model"],
                "priority": task.priority.value,
            },
            total_execution_time_ms=round((time.time() - start_time) * 1000, 2),
        )

    async def process_task(
        self,
        description: str,
        user_id: str,
        context: Dict[str, Any] = None,
        priority: TaskPriority = TaskPriority.MEDIUM,
        deadline: Optional[datetime] = None,
    ) -> SamAIResponse:
        context = context or {}
        task = SamTask(
            id=str(uuid.uuid4()),
            description=description,
            intent_category="unknown",
            module="general",
            priority=priority,
            user_id=user_id,
            context=context,
            estimated_cost=0.0,
        )
        return await self.execute(task)

    def get_system_status(self) -> Dict[str, Any]:
        from orchestrator.task_router import task_router
        from agents import agent_executor
        from gateway.api_gateway import api_gateway
        from analytics.cost_tracker import cost_tracker

        return {
            "status": "operational",
            "components": {
                "orchestrator": {"intents": len(task_router._intents), "modules": len(task_router._modules)},
                "agents": {"count": agent_executor.get_agent_count(), "available": agent_executor.get_available_agents()},
                "gateway": api_gateway.get_gateway_stats(),
                "analytics": {"stats": "available"},
            },
            "timestamp": datetime.utcnow().isoformat(),
        }


sam_ai_core = SamAICore()
