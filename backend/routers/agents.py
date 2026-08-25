from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from security import get_current_user
from agents import agent_router
import json

router = APIRouter(
    prefix="/agents",
    tags=["AI Agents"]
)

@router.post("/run")
async def run_agent_task(
    task: str = Form(...),
    context: str = Form(None),
    use_planning: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Run a task through the autonomous agent system"""
    context_dict = {}
    if context:
        try:
            context_dict = json.loads(context)
        except:
            context_dict = {"raw_context": context}
    
    try:
        result = await agent_router.route_task(task, context_dict, use_planning)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

@router.get("/available")
async def get_available_agents(
    current_user: dict = Depends(get_current_user)
):
    from agents import agent_executor
    return {
        "agents": agent_executor.get_available_agents(),
        "count": agent_executor.get_agent_count(),
        "agent_info": agent_executor.get_agent_info(),
    }

@router.get("/tools")
async def get_available_tools():
    """Get list of available tools"""
    from tools import list_tools
    return {"tools": list_tools()}

@router.get("/history")
async def get_agent_history(
    current_user: dict = Depends(get_current_user)
):
    """Get execution history of agents"""
    return {
        "history": agent_router.task_history[-20:] if hasattr(agent_router, 'task_history') else []
    }

@router.post("/tools/execute")
async def execute_tool(
    tool_name: str = Form(...),
    params: str = Form("{}"),
    current_user: dict = Depends(get_current_user)
):
    """Execute a specific tool directly"""
    from tools import get_tool
    tool_instance = get_tool(tool_name)
    if not tool_instance:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found.")
    
    try:
        kwargs = json.loads(params) if params else {}
        res = tool_instance.execute(**kwargs)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")

@router.post("/council")
async def run_council_debate(
    topic: str = Form(...),
    provider: str = Form("gemini"),
    model: str = Form("gemini-2.5-flash"),
    current_user: dict = Depends(get_current_user)
):
    """Run an AI Council Debate across Architect, Security/Performance Critic, and Product Strategist"""
    from agents.council import CouncilAgent
    from agents.base import AgentTask
    
    council = CouncilAgent()
    task = AgentTask(id="council-task", description=topic)
    res = await council.execute(task, context={"provider": provider, "model": model})
    return res
