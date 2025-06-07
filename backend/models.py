\
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, date
from enum import Enum

class GoalStatusEnum(str, Enum):
    INCOMPLETE = "incomplete"
    COMPLETED = "completed"

class TaskVerifiedEnum(str, Enum):
    TRUE = "true"
    FALSE = "false"

class SubmissionVerificationResultEnum(str, Enum):
    REJECTED = "rejected"
    APPROVED = "approved"
    REVERIFY = "reverify"

class ExpectedDataTypeEnum(str, Enum):
    IMAGE = "image"
    TEXT = "text"

# Task Models
class TaskBase(BaseModel):
    goal_id: UUID
    week_number: int
    title: str
    verification_method: str
    expected_data_type: ExpectedDataTypeEnum
    verified: TaskVerifiedEnum = TaskVerifiedEnum.FALSE

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: UUID = Field(default_factory=uuid4)

    class Config:
        orm_mode = True

# Goal Models
class GoalBase(BaseModel):
    title: str
    duration_weeks: int
    xrp_amount: float

class GoalCreateRequest(GoalBase): # For API request
    pass

class GoalCreate(GoalBase): # For DB insertion
    start_date: date = Field(default_factory=date.today)
    status: GoalStatusEnum = GoalStatusEnum.INCOMPLETE

class Goal(GoalBase):
    id: UUID = Field(default_factory=uuid4)
    start_date: date
    status: GoalStatusEnum
    tasks: List[Task] = []

    class Config:
        orm_mode = True

# Submission Models
class SubmissionBase(BaseModel):
    task_id: UUID
    submitted_data_url: str # URL for image or the text blob itself

class SubmissionCreateRequest(BaseModel): # For API request
    submitted_data_url: str

class SubmissionCreate(SubmissionBase): # For DB insertion
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    verification_result: Optional[SubmissionVerificationResultEnum] = None

class Submission(SubmissionBase):
    id: UUID = Field(default_factory=uuid4)
    timestamp: datetime
    verification_result: Optional[SubmissionVerificationResultEnum] = None

    class Config:
        orm_mode = True

class GoalStatusResponse(Goal):
    # tasks are already included in Goal model
    pass
