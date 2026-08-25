"""
SAM AI - Tourism Agent
Plans travel itineraries and provides Sri Lankan tourism information.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class TourismAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Tourism Guide",
            description="Plans travel itineraries and provides Sri Lankan tourism information"
        )
        self.tools = ["place_database", "itinerary_planner", "booking_assistant"]
        self._keywords = ["tourism", "travel", "visit", "tourist", "itinerary", "hotel", "restaurant", "vacation", "holiday", "places to visit"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Planning travel itinerary")
            duration = context.get("duration", "3-5 days")
            destination = context.get("destination", "Sri Lanka")

            prompt = f"""You are a travel planning expert specializing in Sri Lankan tourism. Create detailed itineraries.

Task: {task.description}
Destination: {destination}
Duration: {duration}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Day-by-day itinerary
2. Must-see attractions
3. Dining recommendations
4. Accommodation suggestions
5. Transportation tips"""

            messages = [
                {"role": "system", "content": f"You are a Sri Lankan tourism expert. Provide detailed travel guidance for {destination}."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Created itinerary")
            steps.append("Added recommendations")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "destination": destination, "duration": duration},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Tourism planning failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
