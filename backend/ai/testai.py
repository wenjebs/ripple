import asyncio
from ai import create_tasks, submit_task
import json
import os
from PIL import Image
from starlette.datastructures import UploadFile
import io


base_dir = os.path.dirname(os.path.abspath(__file__))

async def run():
    result = await create_tasks(goal="Get healthy in 1 month", duration_weeks=4)
    with open(f"{base_dir}/generated_tasks.json", "w") as f:
        json.dump(result, f, indent=2)

    print("Saved result to generated_tasks.json")

# asyncio.run(run())


async def test_text_submission():
    result = await submit_task(
        task="Run 1km",
        requirement="Submit a brief description of your run",
        requirement_modality="text",
        submission_text="I swam 1.2km using Strava today",
        submission_images=None
    )
    print("Text Submission Result:", result)

# asyncio.run(test_text_submission())

async def test_image_submission():
    img = Image.new("RGB", (200, 200), color=(255, 0, 0))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    def create_test_image(color):
        img = Image.new("RGB", (200, 200), color=color)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)
        return UploadFile(filename="test.png", file=img_bytes)

    fake_uploads = [
        create_test_image((255, 0, 0)),
        create_test_image((0, 255, 0)) 
    ]


    result = await submit_task(
        task="Run 2km",
        requirement="Upload a screenshot of your 2km run on Strava",
        requirement_modality="image",
        submission_text=None,
        submission_images=fake_uploads
    )
    print("Image Submission Result:", result)

asyncio.run(test_image_submission())