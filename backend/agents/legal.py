"""
SAM AI - Legal Agent
Drafts legal documents, analyzes contracts, and provides legal research.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class LegalAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Legal Assistant",
            description="Drafts legal documents, analyzes contracts, and provides legal research (Sri Lankan law focus)"
        )
        self.tools = ["template_engine", "clause_extractor", "legal_researcher"]
        self._keywords = ["legal", "law", "contract", "agreement", "terms", "privacy policy", "attorney", "clause"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing legal requirements")
            jurisdiction = context.get("jurisdiction", "Sri Lanka")

            prompt = f"""You are a legal document specialist. Draft and analyze legal documents.

Task: {task.description}
Jurisdiction: {jurisdiction}

IMPORTANT: This is informational only, not legal advice. Always consult a qualified attorney.

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Document drafts in proper legal format
2. Clause analysis
3. Key considerations
4. Jurisdiction-specific notes for {jurisdiction}"""

            messages = [
                {"role": "system", "content": f"You are a legal document specialist for {jurisdiction} law. Provide accurate legal document drafts and analysis. Include disclaimer that this is not legal advice."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Drafted legal document")
            steps.append("Analyzed clauses")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "jurisdiction": jurisdiction},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Legal analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
