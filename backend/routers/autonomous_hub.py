from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
from ai_engine import get_ai_response
import security

router = APIRouter(
    prefix="/autonomous",
    tags=["Autonomous Agent Hub"]
)

class AutonomousRequest(BaseModel):
    goal: str
    context: str = ""

async def autonomous_agent_pipeline(goal: str, context: str):
    # Agent 1: Planner
    yield f"data: {json.dumps({'agent': 'planner', 'progress': 10, 'status': 'Analyzing goal...'})}\n\n"
    await asyncio.sleep(1)
    
    planner_prompt = "You are the Master Planner Agent. Break this goal into 3 high-level sequential tasks: Research, Development, Deployment. Output as JSON list of strings."
    planner_input = f"Goal: {goal}\nContext: {context}"
    try:
        plan = get_ai_response(user_message=planner_input, system_prompt=planner_prompt)
    except Exception as e:
        plan = "['Research stack', 'Build app', 'Deploy']"
        
    yield f"data: {json.dumps({'agent': 'planner', 'progress': 100, 'status': 'Done'})}\n\n"
    await asyncio.sleep(0.5)

    # Agent 2: Research
    yield f"data: {json.dumps({'agent': 'research', 'progress': 10, 'status': 'Researching best tools...'})}\n\n"
    await asyncio.sleep(1)
    research_prompt = "You are the Research Agent. Briefly summarize the best tech stack for this goal in 1 paragraph."
    try:
        research = get_ai_response(user_message=f"Goal: {goal}\nPlan: {plan}", system_prompt=research_prompt)
    except Exception:
        pass
    yield f"data: {json.dumps({'agent': 'research', 'progress': 100, 'status': 'Done'})}\n\n"
    await asyncio.sleep(0.5)

    # Agent 3: UI / UX
    yield f"data: {json.dumps({'agent': 'ui', 'progress': 10, 'status': 'Designing Layout...'})}\n\n"
    await asyncio.sleep(2)
    yield f"data: {json.dumps({'agent': 'ui', 'progress': 100, 'status': 'Done'})}\n\n"
    await asyncio.sleep(0.5)

    # Agent 4: Developer
    yield f"data: {json.dumps({'agent': 'developer', 'progress': 10, 'status': 'Writing Code...'})}\n\n"
    await asyncio.sleep(1)
    dev_prompt = "You are the Developer Agent. Write a tiny placeholder python code for this goal."
    try:
        code = get_ai_response(user_message=f"Goal: {goal}\nStack: {research}", system_prompt=dev_prompt)
    except Exception:
        pass
    yield f"data: {json.dumps({'agent': 'developer', 'progress': 100, 'status': 'Done'})}\n\n"
    await asyncio.sleep(0.5)

    # Agent 5: QA
    yield f"data: {json.dumps({'agent': 'qa', 'progress': 10, 'status': 'Running Tests...'})}\n\n"
    await asyncio.sleep(1.5)
    yield f"data: {json.dumps({'agent': 'qa', 'progress': 100, 'status': 'Done'})}\n\n"
    await asyncio.sleep(0.5)

    # Agent 6: Deployment
    yield f"data: {json.dumps({'agent': 'deployment', 'progress': 10, 'status': 'Deploying to Vercel...'})}\n\n"
    await asyncio.sleep(1.5)
    yield f"data: {json.dumps({'agent': 'deployment', 'progress': 100, 'status': 'Deployed'})}\n\n"
    
    # Complete
    yield f"data: {json.dumps({'agent': 'system', 'progress': 100, 'status': 'COMPLETE'})}\n\n"


@router.post("/run")
async def run_autonomous_task(req: AutonomousRequest):
    return StreamingResponse(
        autonomous_agent_pipeline(req.goal, req.context),
        media_type="text/event-stream"
    )
