"""
SAM AI - Storytelling Agent
Creates stories, narratives, and fictional content with character development.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class StorytellerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Storyteller",
            description="Creates stories, narratives, and fictional content with character development"
        )
        self.tools = ["narrative_engine", "character_builder", "world_builder"]
        self._keywords = ["story", "tale", "narrative", "character", "plot", "fiction", "fantasy", "sci-fi"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            genre = context.get("genre", "general")
            style = context.get("style", "engaging")

            steps.append("Developing story concept")

            prompt = f"""You are a creative storyteller. Craft compelling narratives.

Task: {task.description}
Genre: {genre}
Style: {style}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Engaging story with clear narrative arc
2. Well-developed characters
3. Setting descriptions
4. Conflict and resolution
5. Cultural sensitivity (especially for Sri Lankan themes)"""

            messages = [
                {"role": "system", "content": f"You are a creative storyteller specializing in {genre} fiction. Create well-paced, engaging stories."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.8)
            steps.append("Wrote story narrative")
            steps.append("Developed characters")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "genre": genre},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Story writing failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
