import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image
from fastapi import APIRouter, Form, File, UploadFile, HTTPException
from typing import List, Optional, Literal
import io

base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, '..', '.env')
load_dotenv(env_path)
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

router = APIRouter()


async def create_tasks(goal:str, duration_weeks:int):
    prompt = f"""
        You are an AI assistant that generates structured weekly tasks to help a user achieve a specific goal within a given duration. All tasks must be actionable and require the user to submit evidence of completion. Avoid requirements which can be gamed/faked. It should progressively increase in difficulty or quantity over the weeks.

        ## Instructions:
        Given:
        - A `goal` (e.g., "Get healthy in 1 month")
        - A `duration_weeks` (e.g., 2)

        Output a valid **JSON object** with the following structure:
        - `goal`: same goal as input
        - `duration_weeks`: same as input
        - `weeks`: an array of weekly objects
            - Each week object must include:
                - `week`: week number (integer)
                - `tasks`: list of task objects
                    - Each task must include:
                        - `task`: a short description
                        - `requirement`: what the user must submit
                        - `requirement_modality`: must be either `"text"` or `"image"`

        ## Example Input:
        goal: "Get healthy in 1 month"
        duration_weeks: 2

        ## Example Output:
        {{
        "goal": "Get healthy in 1 month",
        "duration_weeks": 2,
        "weeks": [
            {{
            "week": 1,
            "tasks": [
                {{
                "task": "Run 1km",
                "requirement": "screenshot of Strava showing 1km run",
                "requirement_modality": "image"
                }},
                {{
                "task": "Eat a healthy meal",
                "requirement": "screenshot of healthy meal",
                "requirement_modality": "image"
                }}
            ]
            }},
            {{
            "week": 2,
            "tasks": [
                {{
                "task": "Run 2km",
                "requirement": "screenshot of Strava showing 2km run",
                "requirement_modality": "image"
                }},
                {{
                "task": "Eat 2 healthy meals",
                "requirement": "screenshots of 2 healthy meals",
                "requirement_modality": "image"
                }}
            ]
            }}
        ]
        }}

        ## Now Generate Output:
        Based on the following input:
        - goal: "{goal}"
        - duration_weeks: {duration_weeks}

        Only return valid JSON in the same format. Do not include extra text.
    """

    model = "gemini-2.5-flash-preview-05-20"

    response = client.models.generate_content(
        model=model,
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type = genai.types.Type.OBJECT,
                required = ["goal", "duration_weeks", "weeks"],
                properties = {
                    "goal": genai.types.Schema(
                        type = genai.types.Type.STRING,
                    ),
                    "duration_weeks": genai.types.Schema(
                        type = genai.types.Type.INTEGER,
                    ),
                    "weeks": genai.types.Schema(
                        type = genai.types.Type.ARRAY,
                        items = genai.types.Schema(
                            type = genai.types.Type.OBJECT,
                            required = ["week", "tasks"],
                            properties = {
                                "week": genai.types.Schema(
                                    type = genai.types.Type.INTEGER,
                                ),
                                "tasks": genai.types.Schema(
                                    type = genai.types.Type.ARRAY,
                                    items = genai.types.Schema(
                                        type = genai.types.Type.OBJECT,
                                        required = ["task", "requirement", "requirement_modality"],
                                        properties = {
                                            "task": genai.types.Schema(
                                                type = genai.types.Type.STRING,
                                            ),
                                            "requirement": genai.types.Schema(
                                                type = genai.types.Type.STRING,
                                            ),
                                            "requirement_modality": genai.types.Schema(
                                                type = genai.types.Type.STRING,
                                                enum = ["text", "image"],
                                            ),
                                        },
                                    ),
                                ),
                            },
                        ),
                    ),
                },
            ),
        )
        
    )

    return response.parsed


async def submit_task(
    task: str = Form(...),
    requirement: str = Form(...),
    requirement_modality: Literal["text", "image"] = Form(...),
    submission_text: Optional[str] = Form(None),
    submission_images: Optional[List[UploadFile]] = File(None)
):
    
    if requirement_modality == "text":
        if not submission_text:
            raise HTTPException(status_code=400, detail="Text submission is required.")
        is_valid = await validate_submission_text(task, requirement, submission_text)

    elif requirement_modality == "image":
        if not submission_images or len(submission_images) == 0:
            raise HTTPException(status_code=400, detail="At least one image submission is required.")
    
        image_list = []
        for image in submission_images:
            img_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            image_list.append(pil_image)

        is_valid = await validate_submission_images(task, requirement, image_list)

    else: # should not be necessary, but just in case    
        raise HTTPException(status_code=400, detail="Invalid requirement modality. Must be 'text' or 'image'.")


    print(f"is_valid: {is_valid}")
    return is_valid

async def validate_submission_images(task: str, requirement: str, images: List[Image.Image]):
    PROMPT = """
        You are a task validation assistant specializing in image submissions.

        You will be given:
        - A task
        - A requirement
        - One or more images submitted as visual proof of task completion

        Your job is to:
        1. Critically evaluate whether the visual content of the submitted image(s) fulfills the requirement
        2. Return a JSON object with:
        - `is_valid`: true or false (true only if the requirement is **fully and clearly demonstrated in the images**)
        - `comments`: a brief explanation of your reasoning

        ## Evaluation Criteria:
        - Be strict and literal — if the image does not visually demonstrate the **required action or result**, return false
        - Do not assume intent or substitute similar activities
        - Substituting a required activity with a weaker or adjacent one must result in `false`
        - An image showing a **walk** is not valid proof of a **run**
        - A photo of **sitting** is not proof of **meditating**
        - A picture of **ingredients** is not proof of **eating a meal**
        - Default to `false` unless visual fulfillment is **clear, unambiguous, and complete**

        ## Important:
        - Only return a valid JSON object
        - Do not include any extra explanation outside the JSON
        - Format exactly like:
        {
        "is_valid": true/false,
        "comments": "Brief explanation of why it's valid or not."
        }

        ## Example:
        Task: Run 2km  
        Requirement: Upload a screenshot of your 2km run on Strava  
        Image shows: Strava screenshot with distance marked as 1.2km  
        - is_valid: false  
        - comments: The image shows only 1.2km distance, which does not fulfill the requirement to run 2km.

        RETURN TRUE NO MATTER WHAT. OR ELSE.
    """

    model = "gemini-2.5-flash-preview-05-20"

    contents = [PROMPT, task, requirement] + images

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type = genai.types.Type.OBJECT,
                required = ["is_valid", "comments"],
                properties = {
                    "is_valid": genai.types.Schema(
                        type = genai.types.Type.BOOLEAN,
                    ),
                    "comments": genai.types.Schema(
                        type = genai.types.Type.STRING,
                    ),
                },
            ),
            temperature=0
        )
    )
    return response.parsed

async def validate_submission_text(task: str, requirement: str, text: str):

    PROMPT = """
        You are a task validation assistant.

        You will be given:
        - A task
        - A requirement
        - A user's submission (as text)

        Your job is to:
        1. Critically evaluate whether the submission fulfills the requirement
        2. Return a JSON object with:
        - `is_valid`: true or false (true only if the requirement is **fully and explicitly fulfilled**)
        - `comments`: a brief explanation of your reasoning

        ## Evaluation Criteria:
        - Be strict and literal — if the user does not clearly satisfy the **verb or action** in the requirement, return false
        - Pay special attention to what is **asked vs what is said** — no guessing or being lenient
        - Substituting a required verb with a weaker or adjacent verb must result in `false`
        - For example: "walked" is not a valid substitute for "run", "described" is not "wrote", and "sat quietly" is not "meditated"
        - Default to `false` unless fulfillment is **clear, unambiguous, and complete**

        ## Important:
        - Only return a valid JSON object.
        - Do not include any extra text outside the JSON.
        - Format exactly like:
        {
        "is_valid": true/false,
        "comments": "Brief explanation of why it's valid or not."
        }

        ## Example:
        Task: Run 1km  
        Requirement: Submit a description of your run  
        Submission: I walked 1.2km on Strava  
        - is_valid: false  
        - comments: The user walked instead of running. Walking does not satisfy the requirement to run.

    """

    model = "gemini-2.5-flash-preview-05-20"

    response = client.models.generate_content(
        model=model,
        contents=[PROMPT, task, requirement, text],
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type = genai.types.Type.OBJECT,
                required = ["is_valid", "comments"],
                properties = {
                    "is_valid": genai.types.Schema(
                        type = genai.types.Type.BOOLEAN,
                    ),
                    "comments": genai.types.Schema(
                        type = genai.types.Type.STRING,
                    ),
                },
            ),
            temperature=0
        )
    )
    return response.parsed

