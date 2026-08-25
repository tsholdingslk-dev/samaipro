"""
SAM AI - Knowledge Agent
Answers questions from the knowledge base using RAG.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class KnowledgeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Knowledge Assistant",
            description="Answers questions from the knowledge base using RAG retrieval"
        )
        self.tools = ["rag_engine", "document_search", "fact_checker"]
        self._keywords = ["knowledge", "database", "faq", "docs", "documentation", "company info", "policy", "handbook", "what is", "how to"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Searching knowledge base")
            from knowledge.knowledge_manager import KnowledgeManager
            from database import SessionLocal

            project_id = context.get("project_id", "general")
            db = SessionLocal()
            km = KnowledgeManager(db)

            results = km.search_knowledge(task.description, top_k=5)
            steps.append(f"Found {len(results)} relevant knowledge entries")

            knowledge_context = ""
            if results:
                knowledge_context = "\n".join([f"[Source: {r['source']}] {r['content']}" for r in results])

            system_prompt = "You are a knowledge assistant. Answer based on retrieved documents. If info is not found, say so honestly."
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Question: {task.description}\n\nKnowledge Base Context:\n{knowledge_context}\n\nContext: {json.dumps(context) if context else 'None'}"}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Generated knowledge-based response")

            db.close()

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "sources_found": len(results)},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Knowledge query failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
