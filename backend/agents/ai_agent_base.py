"""
SAM AI - AI Agent Base Module
Provides a factory pattern for creating specialized AI agents with minimal boilerplate.
All 35 agents inherit from BaseAgent and use the factory for common patterns.
"""

import asyncio
import time
import uuid
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from abc import ABC, abstractmethod

from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class AIAgent(BaseAgent, ABC):
    """Base for AI-only agents that delegate to api_hub with a specific system prompt."""

    system_prompt: str = "You are a helpful AI assistant."
    temperature: float = 0.7
    max_tokens: int = 4000

    def can_handle(self, task_description: str) -> bool:
        keywords = getattr(self, '_keywords', [])
        if not keywords:
            return True
        return any(k in task_description.lower() for k in keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps_completed = []

        try:
            steps_completed.append(f"Analyzing task for {self.name}")

            prompt = self._build_prompt(task, context)
            messages = [
                {"role": "system", "content": self._get_system_prompt(context)},
                {"role": "user", "content": prompt},
            ]

            steps_completed.append("Querying AI model")
            result = await api_hub.chat(messages, temperature=self.temperature)
            steps_completed.append("Generated response")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            if hasattr(self, '_post_process'):
                result_content = self._post_process(result["content"])
            else:
                result_content = result["content"]

            return self.create_response(
                task=task,
                result=result_content,
                steps=steps_completed,
                metadata={"provider": result.get("provider"), "model": result.get("model")},
                execution_time=time.time() - start_time,
            )
        except Exception as e:
            task.status = "failed"
            return AgentResponse(
                agent_name=self.name,
                task_id=task.id,
                status="failed",
                result=f"{self.name} failed: {str(e)}",
                steps_completed=steps_completed,
                execution_time=time.time() - start_time,
            )

    def _build_prompt(self, task: AgentTask, context: Dict[str, Any]) -> str:
        ctx_str = json.dumps(context, indent=2) if context else "None"
        return f"""Task: {task.description}

Context: {ctx_str}

Provide a thorough, well-structured response in the appropriate format."""

    def _get_system_prompt(self, context: Dict[str, Any]) -> str:
        base_prompt = self.system_prompt
        if context.get("language") == "sinhala":
            base_prompt += "\n\nRespond in natural Sinhala (Katha Karana Sinhala)."
        elif context.get("language") == "tamil":
            base_prompt += "\n\nRespond in Tamil."
        return base_prompt
