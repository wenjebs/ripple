from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from typing import List, Dict, Any
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from models import (
    Goal, GoalCreateRequest, GoalCreate, GoalStatusResponse,
    Task, TaskCreate,
    GoalStatusEnum, TaskVerifiedEnum, SubmissionVerificationResultEnum
)

load_dotenv()

# Supabase Connection
SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# AI Service (Placeholder)
async def generate_tasks_for_goal(goal_title: str, duration_weeks: int) -> List[Dict[str, Any]]:
    # Placeholder: Replace with actual call to OpenAI API or other AI service
    tasks = []
    for week in range(1, duration_weeks + 1):
        tasks.append({
            "week_number": week,
            "title": f"AI Generated Task for '{goal_title}' - Week {week}",
            "verification_method": "AI Verification",
            "expected_data_type": "text"
        })
    return tasks

router = APIRouter(
    prefix="/goals",
    tags=["goals"],
    responses={404: {"description": "Not found"}},
)

@router.get("/status/{goal_id}", response_model=GoalStatusResponse)
async def get_goal_status(
    goal_id: UUID,
):
    # 1. Fetch goal
    goal_response = supabase.table("goals").select("*").eq("id", str(goal_id)).maybe_single().execute()
    if not goal_response.data:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal_db_data = goal_response.data

    # 2. Fetch associated tasks
    tasks_response = supabase.table("tasks").select("*").eq("goal_id", str(goal_id)).order("week_number").execute()
    tasks_db_data = tasks_response.data if tasks_response.data else []

    return GoalStatusResponse(
        **goal_db_data,
        tasks=[Task(**task) for task in tasks_db_data]
    )


@router.post("/create", response_model=GoalStatusResponse)
async def create_goal(
    goal_data: GoalCreateRequest,
    # current_user: User = Depends(get_current_user) # Auth dependency removed
):
    # 1. Create the Goal in the database
    goal_to_create = GoalCreate(
        title=goal_data.title,
        duration_weeks=goal_data.duration_weeks,
        xrp_amount=goal_data.xrp_amount
    )
    try:
        goal_response = supabase.table("goals").insert(goal_to_create.model_dump(mode='json')).execute()
        if not goal_response.data:
            raise HTTPException(status_code=500, detail=f"Could not create goal: {goal_response.error.message if goal_response.error else 'Unknown error'}")
        created_goal_data = goal_response.data[0]
        goal_id = UUID(created_goal_data['id'])

    except Exception as e:
        print(f"!!!!!!!!!!!! Database Exception Type: {type(e)}")
        print(f"!!!!!!!!!!!! Database Exception Args: {e.args}")
        print(f"!!!!!!!!!!!! Database Exception Details: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating goal in DB. Check server logs for details. Type: {type(e).__name__}")

    # 2. Generate tasks for the goal (using AI placeholder)
    try:
        ai_generated_tasks = await generate_tasks_for_goal(goal_data.title, goal_data.duration_weeks)
    except Exception as e:
        # Rollback goal creation or mark as needing task generation?
        # For now, just raise error. Consider cleanup logic for production.
        # supabase.table("goals").delete().eq("id", str(goal_id)).execute() # Example rollback
        raise HTTPException(status_code=500, detail=f"Failed to generate tasks: {str(e)}")

    # 3. Store generated tasks in the database
    tasks_to_insert = []
    for task_data in ai_generated_tasks:
        task_create = TaskCreate(
            goal_id=goal_id,
            week_number=task_data["week_number"],
            title=task_data["title"],
            verification_method=task_data["verification_method"],
            expected_data_type=task_data["expected_data_type"]
        )
        tasks_to_insert.append(task_create.model_dump(mode='json'))

    if tasks_to_insert:
        try:
            tasks_response = supabase.table("tasks").insert(tasks_to_insert).execute()
            if not tasks_response.data:
                # Rollback goal creation
                # supabase.table("goals").delete().eq("id", str(goal_id)).execute()
                raise HTTPException(status_code=500, detail=f"Could not store tasks: {tasks_response.error.message if tasks_response.error else 'Unknown error'}")
            created_tasks_data = tasks_response.data
        except Exception as e:
            # supabase.table("goals").delete().eq("id", str(goal_id)).execute()
            raise HTTPException(status_code=500, detail=f"Error storing tasks in DB: {str(e)}")
    else:
        created_tasks_data = []

    # 4. Prepare and return the response
    # Fetch the created goal again to include its ID and default fields
    final_goal_response = supabase.table("goals").select("*").eq("id", str(goal_id)).single().execute()
    if not final_goal_response.data:
        raise HTTPException(status_code=404, detail="Newly created goal not found after task creation.")

    # Fetch associated tasks
    tasks_for_response = supabase.table("tasks").select("*").eq("goal_id", str(goal_id)).execute()

    return GoalStatusResponse(
        **final_goal_response.data,
        tasks=[Task(**task) for task in tasks_for_response.data]
    )


