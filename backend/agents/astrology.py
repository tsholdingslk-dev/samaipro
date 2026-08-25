"""
SAM AI - Astrology Agent
Handles astrology, birth charts, and traditional predictions (Sri Lankan focus).
"""

import time
import json
from datetime import datetime
from typing import Dict, Any, Optional
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class AstrologyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Astrology Advisor",
            description="Handles astrology, birth charts, and traditional predictions (Sri Lankan astrology focus)"
        )
        self.tools = ["birth_chart", "panchangam", "planetary_transit"]
        self._keywords = ["astrology", "astrological", "birth chart", "kundli", "rasi", "transit", "horoscope", "prokerala", "jyothish"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing astrological requirements")

            location = context.get("location", "Sri Lanka")
            date_str = context.get("date", "")

            system_prompt = """You are an expert astrologer specializing in Tamil and Sinhala astrological systems,
panchangam, planetary transits, and traditional predictions.

IMPORTANT: Whenever you need to display a birth chart (Kundli) or Rasi chakra to the user,
you MUST output it as a special markdown code block named `astrology-chart`.
The content must be a JSON object mapping house numbers (1 to 12) to an array of planet names."""

            prompt = f"""Provide an astrological reading.

Task: {task.description}
Location: {location}
Date/Time: {date_str}

Context: {json.dumps(context) if context else 'None'}

Consider both Vedic (sidereal) and traditional Sri Lankan astrological systems.
Provide:
1. Birth chart analysis
2. Planetary positions
3. Key predictions
4. Remedial suggestions"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Calculated planetary positions")
            steps.append("Generated astrological reading")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "location": location},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Astrology analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
