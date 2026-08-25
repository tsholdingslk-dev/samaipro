"""
SAM AI - Sri Lanka Knowledge Agent
Specializes in Sri Lankan culture, laws, locations, history, and local knowledge.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class SriLankaKnowledgeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Sri Lanka Knowledge Expert",
            description="Specializes in Sri Lankan culture, laws, locations, history, and local knowledge"
        )
        self.tools = ["place_database", "legal_reference", "cultural_guide", "location_lookup"]
        self._keywords = ["srilanka", "sri lanka", "lanka", "colombo", "kandy", "galle", "jaffna", "sinhala", "tamil", "buddhist", "dalada", "sri lankan"]

    def can_handle(self, task_description: str) -> bool:
        task_lower = task_description.lower()
        return any(k in task_lower for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing Sri Lankan context")
            category = context.get("category", "general")

            system_prompt = """You are an expert on Sri Lankan culture, history, geography, laws, and local knowledge.
You specialize in:
- Sri Lankan history, archaeology, and cultural heritage
- Sinhala and Tamil languages, traditions, and customs
- Sri Lankan laws, regulations, and government procedures
- Tourist destinations, places, and local businesses
- Business culture and practices in Sri Lanka

Respond in natural Sinhala (Katha Karana) or Singlish if the user uses Sinhala/Singlish.
Respond in Tamil if the user uses Tamil.
Use English if unsure.

Be culturally accurate and provide specific, detailed information about Sri Lanka."""

            prompt = f"""Task: {task.description}
Category: {category}

Context: {json.dumps(context) if context else 'None'}

Focus specifically on Sri Lankan context, culture, and local knowledge.
Provide detailed, accurate information."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Provided Sri Lankan knowledge")

            project_id = context.get("project_id", "general")
            try:
                from project_brain import get_project_brain
                brain = get_project_brain(project_id)
                rag_context = brain.get_context_for_prompt(task.description, top_k=3)
                if rag_context:
                    steps.append("Retrieved project-specific context")
            except Exception:
                pass

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "category": category, "specialization": "Sri Lanka"},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Sri Lanka knowledge query failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
