"""
SAM AI - Recipe Agent
Creates recipes, meal plans, and cooking instructions.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class RecipeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Recipe Master",
            description="Creates recipes, meal plans, and cooking instructions"
        )
        self.tools = ["ingredient_matcher", "instruction_generator", "meal_planner"]
        self._keywords = ["recipe", "cook", "cooking", "food", "dish", "kitchen", "ingredients", "how to make"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            cuisine = context.get("cuisine", "any")
            dietary = context.get("dietary", "none")

            steps.append("Creating recipe")

            prompt = f"""You are a professional chef and recipe expert. Create detailed recipes.

Task: {task.description}
Cuisine: {cuisine}
Dietary: {dietary}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Ingredient list with quantities
2. Step-by-step instructions
3. Preparation and cooking time
4. Serving suggestions
5. Tips and variations"""

            messages = [
                {"role": "system", "content": f"You are a professional chef specializing in {cuisine} cuisine. Create detailed, clear recipes."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Created recipe")
            steps.append("Added cooking instructions")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "cuisine": cuisine},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Recipe creation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
