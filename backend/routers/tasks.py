from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from typing import List
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from models import (
    Task, TaskCreate,
    TaskVerifiedEnum
)

load_dotenv()

# Supabase Connection
SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: UUID):
    """Get a specific task by ID"""
    try:
        task_response = supabase.table("tasks").select("*").eq("id", str(task_id)).maybe_single().execute()
        if not task_response or not task_response.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return Task(**task_response.data)
    except HTTPException:
        # Re-raise HTTPExceptions (like 404) as-is
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Error fetching task {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving task information")

@router.get("/goal/{goal_id}", response_model=List[Task])
async def get_tasks_by_goal(goal_id: UUID):
    """Get all tasks for a specific goal"""
    tasks_response = supabase.table("tasks").select("*").eq("goal_id", str(goal_id)).order("week_number").execute()
    tasks_data = tasks_response.data if tasks_response.data else []
    
    return [Task(**task) for task in tasks_data]
