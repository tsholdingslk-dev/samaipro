"""
SAM AI - Document Agent
Processes PDFs, Word docs, and other document formats for extraction and analysis.
"""

import time
import json
import os
import tempfile
from datetime import datetime
from typing import Dict, Any, Optional
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class DocumentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Document Processor",
            description="Processes PDFs, Word docs, and extracts information from documents"
        )
        self.tools = ["pdf_processor", "docx_processor", "format_converter"]
        self._keywords = ["pdf", "document", "word", "docx", "report", "format"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            document_text = context.get("document_text", "")
            document_url = context.get("document_url", "")
            action_type = context.get("action", "analyze")

            steps.append("Processing document")

            if not document_text and document_url:
                import httpx
                try:
                    async with httpx.AsyncClient(timeout=30) as client:
                        resp = await client.get(document_url)
                        document_text = resp.text[:10000]
                except Exception as e:
                    document_text = f"[Unable to fetch document: {e}]"

            if not document_text:
                document_text = task.description

            prompt = f"""You are a document analysis expert. Process and analyze this document.

Task: {task.description}
Action: {action_type}

Document Content:
{document_text[:8000]}

Context: {json.dumps({k:v for k,v in context.items() if k != 'document_text' and k != 'document_url'}) if context else 'None'}

Provide:
1. Summary of the document
2. Key points and extracted information
3. Any analysis requested in the task"""

            messages = [
                {"role": "system", "content": "You are a document analysis expert. Extract key information and provide clear summaries."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Analyzed document content")
            steps.append("Extracted key information")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "action": action_type},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Document processing failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
