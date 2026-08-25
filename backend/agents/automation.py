"""
SAM AI - Automation Agent
Creates workflow automations, scripts, and integration setups.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class AutomationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Automation Specialist",
            description="Creates workflow automations, scripts, and integration setups"
        )
        self.tools = ["script_runner", "workflow_builder", "integration_setup"]
        self._keywords = ["automate", "automation", "workflow", "script", "bot", "integration", "zapier", "make.com", "schedule"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing automation requirements")
            platform = context.get("platform", "general")

            prompt = f"""You are an automation expert. Design and implement workflow automations.

Task: {task.description}
Platform: {platform}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Workflow design and architecture
2. Implementation steps
3. Code/scripts if needed
4. Setup instructions"""

            messages = [
                {"role": "system", "content": f"You are an automation expert specializing in {platform} workflows."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Designed automation workflow")
            steps.append("Generated implementation steps")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "platform": platform},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Automation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
