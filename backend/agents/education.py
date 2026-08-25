"""
SAM AI - Education Agent
Provides tutoring, explanations, and educational content across subjects.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class EducationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Education Tutor",
            description="Provides tutoring, explanations, and educational content across subjects"
        )
        self.tools = ["tutor_engine", "quiz_generator", "concept_mapper", "lesson_planner"]
        self._keywords = ["teach", "learn", "tutor", "study", "explain", "tutorial", "lesson", "course", "student", "homework", "exam", "university"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            subject = context.get("subject", "general")
            level = context.get("level", "high_school")

            steps.append("Analyzing educational requirements")

            prompt = f"""You are an expert educator. Provide clear, accurate educational explanations.

Task: {task.description}

Subject: {subject}
Level: {level}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Clear explanation of the concept
2. Examples and analogies
3. Step-by-step breakdown if applicable
4. Practice questions if appropriate"""

            messages = [
                {"role": "system", "content": f"You are a {subject} tutor. Explain concepts clearly and understandably for {level} level students."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Generated educational content")
            steps.append("Added examples and practice material")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "subject": subject, "level": level},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Educational analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
