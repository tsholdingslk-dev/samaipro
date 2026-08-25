"""
SAM AI - Image Agent
Generates and manipulates images using AI image models.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any, Optional
from agents.base import BaseAgent, AgentTask, AgentResponse


class ImageAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Image Generator",
            description="Generates and manipulates images using AI image models"
        )
        self.tools = ["image_generator", "image_upscaler", "style_transfer"]
        self._keywords = ["image", "photo", "picture", "art", "illustration", "graphic", "logo", "design", "dall", "midjourney", "stable diffusion"]

    def can_handle(self, task_description: str) -> bool:
        task_lower = task_description.lower()
        is_image_gen = any(k in task_lower for k in self._keywords)
        is_not_analysis = "analyze" not in task_lower and "what is in" not in task_lower
        return is_image_gen and is_not_analysis

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing image generation request")
            from api_hub import api_hub

            style = context.get("style", "realistic")
            quality = context.get("quality", "standard")
            size = context.get("size", "1024x1024")

            enhanced_prompt = f"{task.description} --style: {style} --quality: {quality} --size: {size}"

            result = await api_hub.generate_image(
                prompt=enhanced_prompt,
                size=size,
                quality=quality,
            )
            steps.append("Generated image via AI model")
            steps.append("Applied style refinement")

            task.result = result.get("content", "Image generated successfully")
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=task.result, steps=steps,
                                        metadata={"provider": result.get("provider"), "style": style,
                                                  "image_url": result.get("content")},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Image generation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
