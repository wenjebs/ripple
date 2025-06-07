# Habit Goals API with XRP Stakes

A FastAPI application for managing habit goals with XRP stakes and AI task generation.

## Project Structure

```
backend/
├── main.py                 # Main FastAPI application
├── models.py              # Pydantic data models
├── routers/               # API route modules
│   ├── __init__.py       # Package initialization
│   ├── goals.py          # Goal-related endpoints
│   ├── submissions.py    # Submission-related endpoints
│   └── tasks.py          # Task-related endpoints
├── requirements.txt       # Python dependencies
└── .env                  # Environment variables (not in git)
```

## API Endpoints

### Goals Router (`/goals`)
- `GET /goals/status/{goal_id}` - Get goal status with associated tasks
- `POST /goals/create` - Create a new goal with AI-generated tasks

### Submissions Router (`/submissions`)
- `POST /submissions/submit_task/{task_id}` - Submit task completion for verification

### Tasks Router (`/tasks`)
- `GET /tasks/{task_id}` - Get a specific task by ID
- `GET /tasks/goal/{goal_id}` - Get all tasks for a specific goal

### Root Endpoints
- `GET /` - API information and endpoint list
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## Setup and Installation

1. Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
DATABASE_URL=your_postgresql_url
```

4. Run the application:
```bash
uvicorn main:app --reload
```

## Router Architecture

Each router module follows this pattern:

1. **Import dependencies**: FastAPI, database client, models
2. **Initialize router**: Create APIRouter with prefix and tags
3. **Define endpoints**: Use router decorators instead of app decorators
4. **Export router**: Available for inclusion in main app

### Example Router Structure:
```python
from fastapi import APIRouter

router = APIRouter(
    prefix="/example",
    tags=["example"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def example_endpoint():
    return {"message": "Example"}
```

## Database Schema

The application uses PostgreSQL with these main tables:
- `goals` - User goals with XRP stakes
- `tasks` - AI-generated tasks for each goal
- `submissions` - Task completion submissions

## AI Integration

- **Task Generation**: AI generates weekly tasks based on goal description
- **Submission Verification**: AI verifies task completion submissions

## Development

To add new endpoints:
1. Add them to the appropriate router file
2. Import necessary models and dependencies
3. The router is automatically included in the main app

The main application will automatically include all routers defined in the `routers/` directory. 