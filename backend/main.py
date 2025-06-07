from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Dict, Any
from uuid import UUID
from datetime import date
from contextlib import asynccontextmanager # Added
import asyncpg # Added

# Import routers
from routers import goals, submissions, tasks, auth

load_dotenv()

# SQL Definitions for table creation
CREATE_GOALS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    xrp_amount REAL NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'completed')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
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
    verification_result TEXT CHECK (verification_result IN ('true', 'false'))
);
"""

CREATE_USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(34) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
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
        # Create users table first (referenced by goals)
        await conn.execute(CREATE_USERS_TABLE_SQL)
        print("- 'users' table processed.")
        
        # Check if goals table needs user_id column
        try:
            # Try to add user_id column if it doesn't exist
            await conn.execute("ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;")
            print("- 'goals' table user_id column added if missing.")
        except Exception as e:
            print(f"- Note: Could not add user_id column to goals table: {e}")
        
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

app = FastAPI(
    title="Habit Goals API with XRP Stakes",
    description="API for managing habit goals with XRP stakes and AI task generation",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Supabase Connection
SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Include routers
app.include_router(auth.router)
app.include_router(goals.router)
app.include_router(submissions.router)
app.include_router(tasks.router)

# --- Root Endpoint ---
@app.get("/")
async def root():
    return {
        "message": "Habit Goals API with XRP Stakes",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/auth",
            "goals": "/goals",
            "submissions": "/submissions", 
            "tasks": "/tasks"
        }
    }

