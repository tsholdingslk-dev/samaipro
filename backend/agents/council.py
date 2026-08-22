"""
SAM AI - Council Agent (Multi-Agent Debate & Consensus Engine)
Spawns 3 specialized personas (Architect, Critic, Strategist) to debate a problem and synthesize a unified master solution.
"""

import time
import uuid
from typing import Dict, Any, List
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub

class CouncilAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="AI Council",
            description="Multi-agent debate system combining Architect, Security/Performance Critic, and Strategist perspectives."
        )
        self.tools = ["search", "web_scraper", "code_executor", "analyzer"]

    def can_handle(self, task_description: str) -> bool:
        keywords = ["council", "debate", "review", "evaluate", "compare", "architecture", "strategy", "opinion", "perspectives"]
        return any(k in task_description.lower() for k in keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        
        goal = task.description
        provider = context.get("provider", "gemini")
        model = context.get("model", "gemini-2.5-flash")

        # Step 1: Architect Perspective
        steps.append("🏛️ Architect Persona analyzing technical structure & design...")
        architect_prompt = (
            f"You are the Lead Systems Architect in an elite AI Council.\n"
            f"Topic: '{goal}'\n"
            f"Analyze from an architectural, technical, modular, and long-term scalability perspective. "
            f"Provide concrete structural recommendations."
        )
        architect_res = await api_hub.chat([
            {"role": "system", "content": "You are a Lead Systems Architect. Analyze from an architectural perspective."},
            {"role": "user", "content": architect_prompt}
        ])
        architect_opinion = architect_res.get("content", "Architect analysis unavailable.")

        # Step 2: Critic Perspective
        steps.append("🛡️ Security & Performance Critic analyzing risks, edge cases & flaws...")
        critic_prompt = (
            f"You are the Security & Performance Critic in an elite AI Council.\n"
            f"Topic: '{goal}'\n"
            f"Architect's Proposal:\n{architect_opinion}\n\n"
            f"Critique this proposal rigorously. Identify security risks, performance bottlenecks, edge cases, and missing safeguards."
        )
        critic_res = await api_hub.chat([
            {"role": "system", "content": "You are a Security & Performance Critic. Identify risks and flaws."},
            {"role": "user", "content": critic_prompt}
        ])
        critic_opinion = critic_res.get("content", "Critic analysis unavailable.")

        # Step 3: Strategist Perspective
        steps.append("💡 Product & User Strategist reviewing user value & execution simplicity...")
        strategist_prompt = (
            f"You are the Product & User Strategist in an elite AI Council.\n"
            f"Topic: '{goal}'\n"
            f"Architect Proposal:\n{architect_opinion}\n"
            f"Critic Feedback:\n{critic_opinion}\n\n"
            f"Evaluate user experience, practical implementation timeline, simplicity, and key business/user value."
        )
        strategist_res = await api_hub.chat([
            {"role": "system", "content": "You are a Product & User Strategist. Evaluate user value and simplicity."},
            {"role": "user", "content": strategist_prompt}
        ])
        strategist_opinion = strategist_res.get("content", "Strategist analysis unavailable.")

        # Step 4: Final Master Synthesis
        steps.append("👑 Council Chair synthesizing master verdict and actionable plan...")
        synthesis_prompt = (
            f"You are the Council Chair summarizing the consensus for the user on: '{goal}'\n\n"
            f"--- PERSPECTIVE 1: ARCHITECT ---\n{architect_opinion}\n\n"
            f"--- PERSPECTIVE 2: SECURITY & PERFORMANCE CRITIC ---\n{critic_opinion}\n\n"
            f"--- PERSPECTIVE 3: PRODUCT STRATEGIST ---\n{strategist_opinion}\n\n"
            f"Synthesize these perspectives into a brilliant, polished, cohesive master response with clear actionable recommendations."
        )
        synthesis_res = await api_hub.chat([
            {"role": "system", "content": "You are the Council Chair synthesizing a master response."},
            {"role": "user", "content": synthesis_prompt}
        ])
        final_synthesis = synthesis_res.get("content", "Synthesis unavailable.")

        execution_time = round(time.time() - start_time, 2)
        
        return self.create_response(
            task=task,
            result=final_synthesis,
            steps=steps,
            metadata={
                "architect_opinion": architect_opinion,
                "critic_opinion": critic_opinion,
                "strategist_opinion": strategist_opinion,
                "council_members": ["Architect", "Security Critic", "Product Strategist"]
            },
            execution_time=execution_time
        )
