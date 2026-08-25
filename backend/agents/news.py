"""
SAM AI - News Agent
Aggregates news, synthesizes current events, and tracks trending topics.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import AgentTask, AgentResponse
from api_hub import api_hub
from agents.base import BaseAgent


class NewsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="News Synthesizer",
            description="Aggregates news, synthesizes current events, and tracks trending topics"
        )
        self.tools = ["news_aggregator", "synthesizer", "trending_tracker"]
        self._keywords = ["news", "current", "latest", "breaking", "headlines", "today", "recent", "update", "current events"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Researching latest news")

            from knowledge.web_crawler import WebCrawler
            crawler = WebCrawler()
            search_query = context.get("search_query", task.description)
            search_results = crawler.search_web(search_query, num_results=5)
            steps.append(f"Found {len(search_results)} news sources")

            search_context = json.dumps(search_results, indent=2, default=str)

            prompt = f"""You are a news synthesizer. Compile and analyze current news.

Task: {task.description}

Search Results: {search_context}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Key news summaries (3-5 items)
2. Trending topics
3. Impact analysis
4. Reliable sources cited"""

            messages = [
                {"role": "system", "content": "You are a news editor. Provide factual, well-sourced news synthesis."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Synthesized news report")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "sources_found": len(search_results)},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"News aggregation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
