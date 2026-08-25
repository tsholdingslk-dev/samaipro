"""
SAM AI - Lead Generation Agent
Discovers businesses, extracts contact info, and generates outreach templates.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class LeadAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Lead Generator",
            description="Discovers businesses, extracts contact information, and generates outreach templates"
        )
        self.tools = ["web_scraper", "email_finder", "outreach_generator"]
        self._keywords = ["lead", "leads", "business directory", "customers", "prospects", "outreach", "cold email", "sales leads", "find business"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            location = context.get("location", "Sri Lanka")
            business_type = context.get("business_type", "")

            steps.append("Identifying target businesses")

            from knowledge.web_crawler import WebCrawler
            crawler = WebCrawler()
            search_query = f"{business_type} {location}" if business_type else f"businesses in {location}"
            business_results = crawler.search_web(search_query, num_results=10)
            steps.append(f"Found {len(business_results)} potential leads")

            search_context = json.dumps(business_results, indent=2, default=str)

            prompt = f"""You are a lead generation specialist. Find and qualify business leads.

Task: {task.description}
Location: {location}
Business Type: {business_type}

Search Results: {search_context}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. List of qualified leads with details
2. Contact information where available
3. Outreach strategy
4. Follow-up templates"""

            messages = [
                {"role": "system", "content": "You are a B2B lead generation expert specializing in Sri Lankan markets."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Qualified leads")
            steps.append("Generated outreach templates")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "leads_found": len(business_results)},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Lead generation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
