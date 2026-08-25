"""
SAM AI - Social Media Agent
Creates social media content, captions, and manages posting schedules.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class SocialAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Social Media Manager",
            description="Creates social media content, captions, and manages posting schedules"
        )
        self.tools = ["content_generator", "hashtag_researcher", "scheduler"]
        self._keywords = ["facebook", "instagram", "twitter", "x.com", "linkedin", "tiktok", "social media", "post", "share", "caption"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            platform = context.get("platform", "general")

            steps.append("Analyzing social content requirements")

            prompt = f"""You are a social media content creator. Create engaging content for social platforms.

Task: {task.description}
Platform: {platform}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Engaging post caption
2. Relevant hashtags
3. Call-to-action
4. If multi-post: content calendar suggestions"""

            messages = [
                {"role": "system", "content": f"You are a {platform} content expert. Create viral, engaging social media content."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Created social content")
            steps.append("Optimized engagement")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "platform": platform},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Social content creation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
