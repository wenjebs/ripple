from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from ai.ai import create_tasks as ai_create_tasks # Import the AI function
from models import (
    GoalCreateRequest, GoalCreate, GoalStatusResponse,
    Task, TaskCreate
)
from routers.auth import get_current_user_dep

load_dotenv()

# Supabase Connection
SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(
    prefix="/goals",
    tags=["goals"],
    responses={404: {"description": "Not found"}},
)

@router.get("/status/{goal_id}", response_model=GoalStatusResponse)
async def get_goal_status(
    goal_id: UUID,
    current_user: dict = Depends(get_current_user_dep)
):
    # 1. Fetch goal (ensure it belongs to the current user)
    try:
        goal_response = supabase.table("goals").select("*").eq("id", str(goal_id)).eq("user_id", current_user["user_id"]).maybe_single().execute()
        if not goal_response or not goal_response.data:
            raise HTTPException(status_code=404, detail="Goal not found")
        goal_db_data = goal_response.data
    except HTTPException:
        # Re-raise HTTPExceptions (like 404) as-is
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Error fetching goal {goal_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving goal information")

    # 2. Fetch associated tasks
    try:
        tasks_response = supabase.table("tasks").select("*").eq("goal_id", str(goal_id)).order("week_number").execute()
        tasks_db_data = tasks_response.data if tasks_response and tasks_response.data else []
    except Exception as e:
        # Log the error for debugging
        print(f"Error fetching tasks for goal {goal_id}: {e}")
        tasks_db_data = []

    return GoalStatusResponse(
        **goal_db_data,
        tasks=[Task(**task) for task in tasks_db_data]
    )


@router.post("/create", response_model=GoalStatusResponse)
async def create_goal(
    goal_data: GoalCreateRequest,
    current_user: dict = Depends(get_current_user_dep)
):
    # 1. Create the Goal in the database
    goal_to_create = GoalCreate(
        title=goal_data.title,
        duration_weeks=goal_data.duration_weeks,
        xrp_amount=goal_data.xrp_amount,
        user_id=UUID(current_user["user_id"])
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
        # Call the actual AI service function
        ai_response = await ai_create_tasks(goal=goal_data.title, duration_weeks=goal_data.duration_weeks)
        if not ai_response or "weeks" not in ai_response:
            raise HTTPException(status_code=500, detail="AI service returned an invalid response.")
        
        # Process the AI response
        ai_generated_tasks_structured = ai_response.get("weeks", [])

    except Exception as e:
        # Rollback goal creation or mark as needing task generation?
        # For now, just raise error. Consider cleanup logic for production.
        # supabase.table("goals").delete().eq("id", str(goal_id)).execute() # Example rollback
        raise HTTPException(status_code=500, detail=f"Failed to generate tasks: {str(e)}")

    # 3. Store generated tasks in the database
    tasks_to_insert = []
    for week_data in ai_generated_tasks_structured: # Iterate through weeks
        current_week_number = week_data.get("week")
        if current_week_number is None:
            # Handle cases where week number might be missing, though schema requires it
            print(f"Warning: Skipping week data due to missing 'week' number: {week_data}")
            continue
        for task_item in week_data.get("tasks", []): # Iterate through tasks in a week
            task_create = TaskCreate(
                goal_id=goal_id,
                week_number=current_week_number,
                title=task_item.get("task"), # Map from 'task'
                verification_method=task_item.get("requirement"), # Map from 'requirement'
                expected_data_type=task_item.get("requirement_modality") # Map from 'requirement_modality'
            )
            tasks_to_insert.append(task_create.model_dump(mode='json'))

    if tasks_to_insert:
        try:
            tasks_response = supabase.table("tasks").insert(tasks_to_insert).execute()
            if not tasks_response.data:
                # Rollback goal creation
                # supabase.table("goals").delete().eq("id", str(goal_id)).execute()
                raise HTTPException(status_code=500, detail=f"Could not store tasks: {tasks_response.error.message if tasks_response.error else 'Unknown error'}")
            # created_tasks_data = tasks_response.data
        except Exception as e:
            # supabase.table("goals").delete().eq("id", str(goal_id)).execute()
            raise HTTPException(status_code=500, detail=f"Error storing tasks in DB: {str(e)}")
    else:
        pass

    # 4. Prepare and return the response
    # Fetch the created goal again to include its ID and default fields
    try:
        final_goal_response = supabase.table("goals").select("*").eq("id", str(goal_id)).single().execute()
        if not final_goal_response or not final_goal_response.data:
            raise HTTPException(status_code=404, detail="Newly created goal not found after task creation.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching created goal {goal_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving created goal information")

    # Fetch associated tasks
    try:
        tasks_for_response = supabase.table("tasks").select("*").eq("goal_id", str(goal_id)).execute()
        tasks_data = tasks_for_response.data if tasks_for_response and tasks_for_response.data else []
    except Exception as e:
        print(f"Error fetching tasks for created goal {goal_id}: {e}")
        tasks_data = []

    return GoalStatusResponse(
        **final_goal_response.data,
        tasks=[Task(**task) for task in tasks_data]
    )


