"""
SAM AI - Data Analysis Agent
Performs statistical analysis, data visualization, and insights extraction.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class DataAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Data Analyst",
            description="Performs statistical analysis, data visualization, and insights extraction"
        )
        self.tools = ["chart_generator", "stats_engine", "pattern_detector"]
        self._keywords = ["data analysis", "analytics", "chart", "graph", "visualize", "dataset", "spreadsheet", "excel", "csv", "statistics"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            data_format = context.get("data_format", "table")
            chart_type = context.get("chart_type", "auto")

            steps.append("Processing data for analysis")

            prompt = f"""You are a data analysis expert. Analyze the data and provide insights.

Task: {task.description}

Data Format: {data_format}
Chart Type: {chart_type}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Key findings and patterns
2. Statistical summary
3. Chart/visualization recommendations
4. Actionable insights"""

            messages = [
                {"role": "system", "content": "You are a data analysis expert. Provide clear, actionable insights from data."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Performed statistical analysis")
            steps.append("Generated insights")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "chart_type": chart_type},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Data analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
