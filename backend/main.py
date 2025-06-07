from fastapi import FastAPI, Depends, HTTPException, Body
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Dict, Any
from uuid import UUID
from datetime import date
from contextlib import asynccontextmanager # Added
import asyncpg # Added

from models import (
    # User, UserCreate, # Removed User models
    Goal, GoalCreateRequest, GoalCreate, GoalStatusResponse,
    Task, TaskCreate,
    Submission, SubmissionCreateRequest, SubmissionCreate,
    GoalStatusEnum, TaskVerifiedEnum, SubmissionVerificationResultEnum
)

load_dotenv()

# SQL Definitions for table creation
CREATE_GOALS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    xrp_amount REAL NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'completed'))
);
"""

CREATE_TASKS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    verification_method TEXT,
    expected_data_type VARCHAR(50) NOT NULL CHECK (expected_data_type IN ('image', 'text')),
    verified VARCHAR(50) NOT NULL DEFAULT 'false' CHECK (verified IN ('true', 'false'))
);
"""

CREATE_SUBMISSIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_data_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_result VARCHAR(50) CHECK (verification_result IN ('rejected', 'approved', 'reverify'))
);
"""

DB_INIT_ERROR_MESSAGE = "Database initialization error. Check DATABASE_URL in .env and ensure PostgreSQL server is accessible."

async def initialize_database():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print(f"Error: DATABASE_URL not found in environment variables. {DB_INIT_ERROR_MESSAGE}")
        # You might want to raise an exception here or handle it as critical failure
        return

    conn = None
    try:
        print(f"Connecting to database for initialization...")
        conn = await asyncpg.connect(db_url)
        print("Successfully connected to database. Creating tables...")
        await conn.execute(CREATE_GOALS_TABLE_SQL)
        print("- 'goals' table processed.")
        await conn.execute(CREATE_TASKS_TABLE_SQL)
        print("- 'tasks' table processed.")
        await conn.execute(CREATE_SUBMISSIONS_TABLE_SQL)
        print("- 'submissions' table processed.")
        print("Database tables initialized successfully.")
    except asyncpg.exceptions.InvalidPasswordError as e:
        print(f"!!! Database Connection Error: Invalid password. Please check your DATABASE_URL. Details: {e}")
    except asyncpg.exceptions.CannotConnectNowError as e:
        print(f"!!! Database Connection Error: Cannot connect to server. Is it running and accessible? Details: {e}")
    except Exception as e:
        print(f"!!! An error occurred during database initialization: {e}")
        print(f"{DB_INIT_ERROR_MESSAGE}")
    finally:
        if conn:
            await conn.close()
            print("Database connection closed.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup: Initializing database...")
    await initialize_database()
    print("Database initialization process finished.")
    yield
    print("Application shutdown.")

app = FastAPI(lifespan=lifespan) # Modified to include lifespan

# Supabase Connection
SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# --- AI Service (Placeholder) ---
async def generate_tasks_for_goal(goal_title: str, duration_weeks: int) -> List[Dict[str, Any]]:
    # Placeholder: Replace with actual call to OpenAI API or other AI service
    # This function should return a list of task dictionaries
    tasks = []
    for week in range(1, duration_weeks + 1):
        tasks.append({
            "week_number": week,
            "title": f"AI Generated Task for '{goal_title}' - Week {week}",
            "verification_method": "AI Verification", # Or be more specific
            "expected_data_type": "text" # Or "image", can be varied by AI
        })
    return tasks

async def verify_submission_ai(submitted_data_url: str, expected_data_type: str) -> SubmissionVerificationResultEnum:
    # Placeholder: Replace with actual call to OpenAI API or other AI service
    print(f"AI Verifying submission: {submitted_data_url} (expected: {expected_data_type})")
    # Simulate AI verification
    if "fail" in submitted_data_url.lower():
        return SubmissionVerificationResultEnum.REJECTED
    return SubmissionVerificationResultEnum.APPROVED

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "Habit Goals API with XRP Stakes"}

@app.post("/create_goal", response_model=GoalStatusResponse)
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

@app.post("/submit_task/{task_id}", response_model=Submission)
async def submit_task(
    task_id: UUID,
    submission_data: SubmissionCreateRequest,
    # current_user: User = Depends(get_current_user) # Auth dependency removed
):
    # 1. Verify task exists
    task_response = supabase.table("tasks").select("*, goals(id)").eq("id", str(task_id)).maybe_single().execute() # Removed goals(user_id)
    if not task_response.data:
        raise HTTPException(status_code=404, detail="Task not found")

    task_db_data = task_response.data
    # Removed user authorization check for the task
    # if task_db_data["goals"]["user_id"] != str(current_user.id):
    #     raise HTTPException(status_code=403, detail="User not authorized to submit for this task")

    if task_db_data["verified"] == TaskVerifiedEnum.TRUE.value:
        raise HTTPException(status_code=400, detail="Task already verified")

    # 2. Perform AI verification (placeholder)
    try:
        verification_status = await verify_submission_ai(
            submission_data.submitted_data_url,
            task_db_data["expected_data_type"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI verification failed: {str(e)}")

    # 3. Create submission record
    submission_to_create = SubmissionCreate(
        task_id=task_id,
        # user_id=current_user.id, # Removed
        submitted_data_url=submission_data.submitted_data_url,
        verification_result=verification_status
    )
    try:
        submission_response = supabase.table("submissions").insert(submission_to_create.model_dump(mode='json')).execute()
        if not submission_response.data:
            raise HTTPException(status_code=500, detail=f"Could not create submission: {submission_response.error.message if submission_response.error else 'Unknown error'}")
        created_submission_data = submission_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating submission in DB: {str(e)}")

    # 4. If submission approved, update task status
    if verification_status == SubmissionVerificationResultEnum.APPROVED:
        try:
            update_task_response = supabase.table("tasks").update({"verified": TaskVerifiedEnum.TRUE.value}).eq("id", str(task_id)).execute()
            if not update_task_response.data:
                 # Log this error, but the submission was still recorded.
                print(f"Warning: Could not update task {task_id} to verified: {update_task_response.error.message if update_task_response.error else 'Unknown error'}")
        except Exception as e:
            print(f"Warning: Error updating task {task_id} status: {str(e)}")

        # 5. Check if all tasks for the goal are completed
        goal_id = task_db_data["goal_id"]
        all_tasks_for_goal_response = supabase.table("tasks").select("id, verified").eq("goal_id", str(goal_id)).execute()
        
        if all_tasks_for_goal_response.data:
            all_verified = all(task['verified'] == TaskVerifiedEnum.TRUE.value for task in all_tasks_for_goal_response.data)
            if all_verified:
                try:
                    update_goal_response = supabase.table("goals").update({"status": GoalStatusEnum.COMPLETED.value}).eq("id", str(goal_id)).execute()
                    if not update_goal_response.data:
                        print(f"Warning: Could not update goal {goal_id} to completed: {update_goal_response.error.message if update_goal_response.error else 'Unknown error'}")
                except Exception as e:
                    print(f"Warning: Error updating goal {goal_id} status: {str(e)}")

    return Submission(**created_submission_data)

@app.get("/goal_status/{goal_id}", response_model=GoalStatusResponse)
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
