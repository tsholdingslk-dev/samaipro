"""
SAM AI - Presentation Agent
Creates slide decks, presentation outlines, and speaker notes.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class PresentationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Presentation Builder",
            description="Creates slide presentations, outlines, and speaker notes"
        )
        self.tools = ["slide_generator", "template_engine", "content_outline"]
        self._keywords = ["presentation", "slides", "ppt", "slideshow", "deck", "talk", "webinar"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []

        try:
            steps.append("Analyzed presentation requirements")

            topic = context.get("topic", "")
            slide_count = context.get("slide_count", 10)
            audience = context.get("audience", "general")

            prompt = f"""You are a presentation design expert. Create a comprehensive slide deck.

Task: {task.description}

Topic: {topic}
Number of Slides: {slide_count}
Audience: {audience}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Slide-by-slide outline with titles
2. Key points for each slide
3. Visual suggestions
4. Speaker notes for each slide
5. Presentation flow and narrative"""

            messages = [
                {"role": "system", "content": "You are a presentation expert. Create engaging, well-structured slide decks."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages)
            steps.append("Created slide outline")
            steps.append("Generated speaker notes")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(
                task=task,
                result=result["content"],
                steps=steps,
                metadata={"provider": result.get("provider"), "slides": slide_count},
                execution_time=time.time() - start_time
            )
        except Exception as e:
            task.status = "failed"
            return AgentResponse(
                agent_name=self.name, task_id=task.id, status="failed",
                result=f"Presentation creation failed: {str(e)}",
                steps_completed=steps, execution_time=time.time() - start_time
            )
