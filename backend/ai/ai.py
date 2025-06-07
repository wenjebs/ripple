import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image
import json
from fastapi import APIRouter

base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, '..', '.env')
load_dotenv(env_path)
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

router = APIRouter()

@router.post("/create-tasks")
async def create_tasks(goal:str, duration_weeks:int):
    prompt = prompt = f"""
        You are an AI assistant that generates structured weekly tasks to help a user achieve a specific goal within a given duration. All tasks must be actionable and require the user to submit evidence of completion. Avoid requirements which can be gamed/faked.

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

print(create_tasks(goal="Get healthy in 1 month", duration_weeks=2))