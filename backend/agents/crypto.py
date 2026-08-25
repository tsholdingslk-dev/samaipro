"""
SAM AI - Crypto Agent
Analyzes cryptocurrency markets, trading signals, and blockchain data.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class CryptoAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Crypto Analyst",
            description="Analyzes cryptocurrency markets, trading signals, and blockchain data"
        )
        self.tools = ["market_data", "price_fetcher", "technical_analyzer"]
        self._keywords = ["crypto", "bitcoin", "ethereum", "blockchain", "token", "trading", "price", "exchange"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing crypto market data")

            prompt = f"""You are a cryptocurrency and blockchain analyst. Provide market insights.

Task: {task.description}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Market analysis
2. Key technical indicators
3. Risk assessment
4. Trading considerations"""

            messages = [
                {"role": "system", "content": "You are a crypto market analyst. Provide factual, data-driven analysis. Include risk warnings."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Generated market analysis")
            steps.append("Added risk assessment")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider")},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Crypto analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
