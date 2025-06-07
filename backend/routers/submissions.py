from fastapi import APIRouter, HTTPException, Depends, File, Form, UploadFile
from uuid import UUID
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional, List, Literal # Added List, Literal
import json # Added json

from models import (
    Submission, SubmissionCreateRequest, SubmissionCreate,
    TaskVerifiedEnum, SubmissionVerificationResultEnum, GoalStatusEnum
)
from ai.ai import submit_task as ai_verify_submission_content # Import the AI function

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

# Removed the placeholder verify_submission_ai function

@router.post("/submit_task_form/", response_model=Submission) # Path changed, task_id removed from path
async def submit_task(
    task_id_str: str = Form(..., alias="task"), # 'task' from form is task_id string
    requirement_desc_form: str = Form(..., alias="requirement"), # 'requirement' from form
    requirement_modality_form: Literal["text", "image"] = Form(...), # 'requirement_modality' from form
    submission_text: Optional[str] = Form(None), # Was submitted_text
    submission_images: Optional[List[UploadFile]] = File(None) # Was submitted_file (single)
):
    try:
        task_id = UUID(task_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Task ID format provided in the 'task' form field.")

    # 1. Verify task exists
    task_response = supabase.table("tasks").select("*, goals(id)").eq("id", str(task_id)).maybe_single().execute()
    if not task_response.data:
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found.")

    task_db_data = task_response.data
    
    current_expected_modality = requirement_modality_form

    if task_db_data["verified"] == TaskVerifiedEnum.TRUE.value:
        raise HTTPException(status_code=400, detail="Task already verified.")

    actual_submission_url_for_db: Optional[str] = "No submission data processed" 

    if current_expected_modality == "image":
        if not submission_images or not any(f for f in submission_images if f is not None): 
            raise HTTPException(status_code=400, detail="Image file(s) are required for this task modality.")
        
        image_filenames = []
        for image_file in submission_images:
            if image_file: 
                if not image_file.content_type or not image_file.content_type.startswith("image/"):
                    raise HTTPException(status_code=400, detail=f"Invalid file type: {image_file.filename}. Please upload images.")
                image_filenames.append(image_file.filename)
        
        if not image_filenames: 
             raise HTTPException(status_code=400, detail="No valid image files provided.")
        actual_submission_url_for_db = json.dumps([f"placeholder_image_path/{fn}" for fn in image_filenames])

    elif current_expected_modality == "text":
        if not submission_text:
            raise HTTPException(status_code=400, detail="Text submission is required for this task modality.")
        actual_submission_url_for_db = submission_text
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported task modality: {current_expected_modality}")

    # 2. Perform AI verification
    verification_status_enum: SubmissionVerificationResultEnum # Type hint for clarity
    verification_comments: str = ""
    try:
        ai_response_dict = await ai_verify_submission_content(
            task=task_db_data["title"],
            requirement=requirement_desc_form,
            requirement_modality=current_expected_modality,
            submission_text=submission_text,
            submission_images=submission_images
        )
        
        if not isinstance(ai_response_dict, dict) or "is_valid" not in ai_response_dict:
            print(f"AI verification returned unexpected format: {ai_response_dict}")
            raise HTTPException(status_code=500, detail="AI verification returned an invalid response format.")

        if ai_response_dict.get("is_valid"):
            verification_status_enum = SubmissionVerificationResultEnum.TRUE
        else:
            verification_status_enum = SubmissionVerificationResultEnum.FALSE
        
        # Extract comments from AI response
        verification_comments = ai_response_dict.get("comments", "No comments provided")

    except HTTPException as e: 
        raise e
    except Exception as e:
        print(f"AI verification encountered an error: {e}")
        raise HTTPException(status_code=500, detail=f"AI verification failed: {str(e)}")

    # 3. Create submission record
    submission_to_create = SubmissionCreate(
        task_id=task_id,
        submitted_data_url=actual_submission_url_for_db,
        verification_result=verification_status_enum.value, # Ensure .value is used here
        verification_comments=verification_comments
    )
    
    # Add this print statement for debugging the exact payload
    print(f"Payload for submission: {submission_to_create.model_dump(mode='json')}") 

    try:
        submission_response = supabase.table("submissions").insert(submission_to_create.model_dump(mode='json')).execute()
        if not submission_response.data:
            error_detail = "Unknown error"
            if submission_response.error:
                error_detail = submission_response.error.message
            raise HTTPException(status_code=500, detail=f"Could not create submission: {error_detail}")
        created_submission_data = submission_response.data[0]
    except Exception as e:
        print(f"Database submission encountered an error: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating submission in DB: {str(e)}")

    # 4. If submission approved, update task status
    if verification_status_enum == SubmissionVerificationResultEnum.TRUE: # Corrected enum member
        try:
            update_task_response = supabase.table("tasks").update({"verified": TaskVerifiedEnum.TRUE.value}).eq("id", str(task_id)).execute()
            if not update_task_response.data:
                print(f"Warning: Could not update task {task_id} to verified: {update_task_response.error.message if update_task_response.error else 'Unknown error'}")
        except Exception as e:
            print(f"Warning: Error updating task {task_id} status: {str(e)}")

        # 5. Check if all tasks for the goal are completed
        goal_id = task_db_data["goals"]["id"] 
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
