from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from models import (
    Submission, SubmissionCreateRequest, SubmissionCreate,
    TaskVerifiedEnum, SubmissionVerificationResultEnum, GoalStatusEnum
)

load_dotenv()

# Supabase Connection
SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


router = APIRouter(
    prefix="/submissions",
    tags=["submissions"],
    responses={404: {"description": "Not found"}},
)

@router.post("/submit_task/{task_id}", response_model=Submission)
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
