"""
SAM AI - Vision Agent
Analyzes images, performs OCR, and answers questions about visual content.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse


class VisionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Vision Analyst",
            description="Analyzes images, performs OCR, and answers questions about visual content"
        )
        self.tools = ["vision_model", "ocr", "object_detection"]
        self._keywords = ["analyze image", "what is in", "describe", "identify", "recognize", "ocr", "read image", "vision"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Processing image for analysis")
            from api_hub import api_hub

            image_data = context.get("image_data", "")
            prompt = context.get("prompt", f"Analyze this image in detail: {task.description}")

            result = await api_hub.analyze_image(
                image_data=image_data,
                prompt=prompt,
            )
            steps.append("Analyzed image content")
            steps.append("Extracted visual information")

            task.result = result.get("content", "Image analysis completed")
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=task.result, steps=steps,
                                        metadata={"provider": result.get("provider")},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Image analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
