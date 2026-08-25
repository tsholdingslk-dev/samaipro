"""
SAM AI - Email Agent
Writes professional emails, subject lines, and email sequences.
"""

import time
from typing import Dict, Any, List
from datetime import datetime
import json
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub

class EmailAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Email Writer",
            description="Writes professional emails, subject lines, and email sequences"
        )
        self.tools = ["template_engine", "subject_optimizer", "tone_adjuster"]
        self._keywords = ["email", "e-mail", "mail", "letter", "subject line", "compose", "message"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []

        try:
            tone = context.get("tone", "professional")
            email_type = context.get("email_type", "general")

            steps.append("Analyzed email requirements")

            prompt = f"""You are a professional email writer. Write a high-quality email.

Task: {task.description}

Email Type: {email_type}
Tone: {tone}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Subject line (optimized for open rates)
2. Email body
3. Call-to-action
4. If applicable: follow-up email sequence"""

            messages = [
                {"role": "system", "content": f"You are a professional email copywriter. Write engaging, {tone} emails."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages)
            steps.append("Drafted email with optimized subject line")
            steps.append("Added call-to-action")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(
                task=task,
                result=result["content"],
                steps=steps,
                metadata={"provider": result.get("provider"), "email_type": email_type, "tone": tone},
                execution_time=time.time() - start_time
            )
        except Exception as e:
            task.status = "failed"
            return AgentResponse(
                agent_name=self.name, task_id=task.id, status="failed",
                result=f"Email writing failed: {str(e)}",
                steps_completed=steps, execution_time=time.time() - start_time
            )
