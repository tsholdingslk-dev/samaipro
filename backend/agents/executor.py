"""
SAM AI - Agent Executor
Executes tasks using appropriate agents from the pool of 35 specialized agents.
"""

import asyncio
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from agents.base import BaseAgent, AgentTask, AgentResponse
from agents.planner import PlannerAgent
from agents.researcher import ResearcherAgent
from agents.coder import CodingAgent
from agents.business import BusinessAgent
from agents.content import ContentAgent
from agents.council import CouncilAgent
from agents.email import EmailAgent
from agents.resume import ResumeAgent
from agents.presentation import PresentationAgent
from agents.seo import SEOAgent
from agents.image_gen import ImageAgent
from agents.vision import VisionAgent
from agents.video import VideoAgent
from agents.voice import VoiceAgent
from agents.translate import TranslationAgent
from agents.knowledge import KnowledgeAgent
from agents.flutter import FlutterAgent
from agents.security import SecurityAnalyst
from agents.data import DataAgent
from agents.social import SocialAgent
from agents.news import NewsAgent
from agents.education import EducationAgent
from agents.lead import LeadAgent
from agents.crypto import CryptoAgent
from agents.automation import AutomationAgent
from agents.legal import LegalAgent
from agents.tourism import TourismAgent
from agents.recipe import RecipeAgent
from agents.entertainment import EntertainmentAgent
from agents.storyteller import StorytellerAgent
from agents.astrology import AstrologyAgent
from agents.document import DocumentAgent
from agents.finance import FinanceAgent
from agents.health import HealthAgent
from agents.sri_lanka import SriLankaKnowledgeAgent


class AgentExecutor:
    def __init__(self):
        self.agents: List[BaseAgent] = [
            CouncilAgent(),
            PlannerAgent(),
            ResearcherAgent(),
            CodingAgent(),
            BusinessAgent(),
            ContentAgent(),
            EmailAgent(),
            ResumeAgent(),
            PresentationAgent(),
            SEOAgent(),
            ImageAgent(),
            VisionAgent(),
            VideoAgent(),
            VoiceAgent(),
            TranslationAgent(),
            KnowledgeAgent(),
            FlutterAgent(),
            SecurityAnalyst(),
            DataAgent(),
            SocialAgent(),
            NewsAgent(),
            EducationAgent(),
            LeadAgent(),
            CryptoAgent(),
            AutomationAgent(),
            LegalAgent(),
            TourismAgent(),
            RecipeAgent(),
            EntertainmentAgent(),
            StorytellerAgent(),
            AstrologyAgent(),
            DocumentAgent(),
            FinanceAgent(),
            HealthAgent(),
            SriLankaKnowledgeAgent(),
        ]
        self.execution_history: List[Dict[str, Any]] = []
        self._agent_index = {agent.name.lower(): agent for agent in self.agents}

    def get_available_agents(self) -> List[str]:
        return [agent.name for agent in self.agents]

    def get_agent_count(self) -> int:
        return len(self.agents)

    def get_agent_info(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": agent.name,
                "description": agent.description,
                "tools": agent.tools,
            }
            for agent in self.agents
        ]

    def select_agent(self, task_description: str) -> Optional[BaseAgent]:
        best_agent = None
        best_score = 0

        for agent in self.agents:
            if agent.can_handle(task_description):
                score = len(task_description.split()) * 0.1 + 1
                if score > best_score:
                    best_score = score
                    best_agent = agent

        return best_agent

    def select_agents_for_task(self, task_description: str) -> List[BaseAgent]:
        selected = []
        for agent in self.agents:
            if agent.can_handle(task_description):
                selected.append(agent)
        return selected

    async def execute(self, task_description: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        start_time = time.time()
        task_id = str(uuid.uuid4())

        context = context or {}

        agent = self.select_agent(task_description)
        if not agent:
            return {
                "task_id": task_id,
                "status": "failed",
                "result": "No suitable agent found for this task",
                "agent_used": None,
                "execution_time": time.time() - start_time
            }

        task = AgentTask(
            id=task_id,
            description=task_description,
            context=context
        )

        response = await agent.execute(task, context)

        self.execution_history.append({
            "task_id": task_id,
            "agent": agent.name,
            "status": response.status,
            "execution_time": response.execution_time,
            "timestamp": datetime.utcnow().isoformat()
        })

        if len(self.execution_history) > 500:
            self.execution_history = self.execution_history[-250:]

        return {
            "task_id": task_id,
            "status": response.status,
            "result": response.result,
            "agent_used": response.agent_name,
            "steps_completed": response.steps_completed,
            "execution_time": response.execution_time,
            "metadata": response.metadata
        }

    async def execute_with_multiple_agents(self, task_description: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        start_time = time.time()
        task_id = str(uuid.uuid4())
        context = context or {}

        relevant_agents = self.select_agents_for_task(task_description)
        if len(relevant_agents) <= 1:
            return await self.execute(task_description, context)

        results = []
        for agent in relevant_agents[:3]:
            task = AgentTask(id=task_id, description=task_description, context=context)
            try:
                response = await agent.execute(task, context)
                results.append({
                    "agent": agent.name,
                    "status": response.status,
                    "result": response.result,
                    "execution_time": response.execution_time,
                })
            except Exception as e:
                results.append({
                    "agent": agent.name,
                    "status": "failed",
                    "result": str(e),
                    "execution_time": 0,
                })

        best_result = max(results, key=lambda x: len(x["result"]) if x["status"] == "completed" else 0)

        return {
            "task_id": task_id,
            "status": "completed",
            "result": best_result["result"],
            "agent_used": best_result["agent"],
            "all_results": results,
            "execution_time": time.time() - start_time,
            "agents_consulted": [r["agent"] for r in results],
        }

    async def execute_plan(self, plan: List[str], context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        results = []
        for step in plan:
            result = await self.execute(step, context)
            results.append(result)
        return results


agent_executor = AgentExecutor()
