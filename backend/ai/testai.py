import asyncio
from ai import create_tasks 
import json
import os

base_dir = os.path.dirname(os.path.abspath(__file__))

async def run():
    result = await create_tasks(goal="Get healthy in 1 month", duration_weeks=2)
    with open(f"{base_dir}/generated_tasks.json", "w") as f:
        json.dump(result, f, indent=2)  # indent=2 for pretty formatting

    print("Saved result to generated_tasks.json")

asyncio.run(run())
