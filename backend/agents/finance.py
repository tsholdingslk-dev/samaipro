"""
SAM AI - Financial Agent
Handles budgeting, investment analysis, and financial planning.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class FinanceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Financial Planner",
            description="Handles budgeting, investment analysis, and financial planning"
        )
        self.tools = ["calculator", "projection_engine", "investment_analyzer"]
        self._keywords = ["finance", "budget", "expense", "tax", "calculation", "loan", "investment plan", "savings", "financial plan"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing financial requirements")
            period = context.get("period", "annual")
            risk_tolerance = context.get("risk_tolerance", "moderate")

            prompt = f"""You are a financial planning expert. Provide detailed financial analysis.

Task: {task.description}
Period: {period}
Risk Tolerance: {risk_tolerance}

IMPORTANT: This is educational/informational only, not financial advice.
Always recommend consulting a qualified financial advisor.

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Financial analysis and calculations
2. Projections
3. Risk considerations
4. Actionable recommendations"""

            messages = [
                {"role": "system", "content": f"You are a financial planning expert. Provide detailed analysis with {risk_tolerance} risk tolerance. Include disclaimer that this is not financial advice."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Performed financial analysis")
            steps.append("Generated projections")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "period": period, "risk_tolerance": risk_tolerance},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Financial analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
