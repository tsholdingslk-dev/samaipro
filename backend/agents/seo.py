"""
SAM AI - SEO Agent
Handles keyword research, content optimization, and ranking analysis.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class SEOAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="SEO Specialist",
            description="Handles keyword research, SEO content optimization, and ranking analysis"
        )
        self.tools = ["keyword_researcher", "seo_analyzer", "content_optimizer"]
        self._keywords = ["seo", "search engine", "keywords", "backlink", "ranking", "traffic", "keyword", "meta"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzed SEO requirements")
            prompt = f"""You are an SEO expert. Analyze and optimize for search engines.

Task: {task.description}
Context: {json.dumps(context) if context else 'None'}

Provide:
1. Keyword research and suggestions
2. On-page SEO recommendations
3. Meta descriptions and title tags
4. Backlink strategy
5. Content optimization suggestions"""

            messages = [
                {"role": "system", "content": "You are an expert SEO strategist. Provide actionable, data-driven SEO recommendations."},
                {"role": "user", "content": prompt}
            ]
            result = await api_hub.chat(messages)
            steps.append("Conducted keyword research")
            steps.append("Generated SEO strategy")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider")}, execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"SEO analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
