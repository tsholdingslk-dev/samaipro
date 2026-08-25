"""
SAM AI - Video Agent
Generates and edits videos, animations, and motion graphics.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class VideoAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Video Creator",
            description="Generates and edits videos, animations, and motion graphics"
        )
        self.tools = ["video_generator", "video_editor", "animation_engine"]
        self._keywords = ["video", "animation", "motion graphics", "reel", "youtube short", "tiktok", "edit video", "create video"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Planning video generation")
            duration = context.get("duration", 5)
            style = context.get("style", "modern")

            prompt = f"""Create a video generation prompt for:

Task: {task.description}
Duration: {duration} seconds
Style: {style}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Detailed video generation prompt
2. Scene breakdown
3. Visual elements description
4. Audio/music recommendations"""

            messages = [
                {"role": "system", "content": "You are a creative video production expert."},
                {"role": "user", "content": prompt}
            ]
            result = await api_hub.chat(messages)
            steps.append("Generated video prompt")
            steps.append("Created scene breakdown")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "duration": duration, "style": style},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Video creation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
