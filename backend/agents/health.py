"""
SAM AI - Health Agent
Provides wellness advice, symptom information, and fitness planning.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class HealthAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Health Assistant",
            description="Provides wellness advice, symptom information, and fitness planning"
        )
        self.tools = ["symptom_checker", "wellness_planner", "nutrition_guide"]
        self._keywords = ["medical", "health", "symptom", "wellness", "fitness", "diet", "nutrition"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing health/wellness requirements")

            prompt = f"""You are a health and wellness assistant. Provide general wellness information.

Task: {task.description}

IMPORTANT: This is general wellness information only, NOT medical advice.
Always consult a qualified healthcare professional for medical concerns.

Context: {json.dumps(context) if context else 'None'}

Provide:
1. General wellness information
2. Lifestyle recommendations
3. Fitness/nutrition guidance
4. Clear disclaimer to consult healthcare professionals"""

            messages = [
                {"role": "system", "content": "You are a health and wellness assistant. Provide general wellness information. Always include medical disclaimer."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Provided wellness guidance")
            steps.append("Included disclaimer")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider")},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Health analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
