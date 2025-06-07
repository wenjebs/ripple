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
    TRUE = "true"
    FALSE = "false"


class ExpectedDataTypeEnum(str, Enum):
    IMAGE = "image"
    TEXT = "text"

# Authentication Models
class WalletAuthRequest(BaseModel):
    wallet_address: str

class WalletAuthChallenge(BaseModel):
    challenge: str
    wallet_address: str

class WalletAuthVerify(BaseModel):
    wallet_address: str
    signature: str
    challenge: str
    xaman_payload_uuid: Optional[str] = None
    xumm_sdk_auth: Optional[bool] = False

class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserBase(BaseModel):
    wallet_address: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

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
        from_attributes = True

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
    user_id: UUID  # Add user association

class Goal(GoalBase):
    id: UUID = Field(default_factory=uuid4)
    start_date: date
    status: GoalStatusEnum
    user_id: UUID  # Add user association
    tasks: List[Task] = []

    class Config:
        from_attributes = True

# Submission Models
class SubmissionBase(BaseModel):
    task_id: UUID
    submitted_data_url: str # URL for image or the text blob itself

class SubmissionCreateRequest(BaseModel): # For API request
    submitted_data_url: str

class SubmissionCreate(SubmissionBase): # For DB insertion
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    verification_result: Optional[SubmissionVerificationResultEnum] = None
    verification_comments: Optional[str] = None

class Submission(SubmissionBase):
    id: UUID = Field(default_factory=uuid4)
    timestamp: datetime
    verification_result: Optional[SubmissionVerificationResultEnum] = None
    verification_comments: Optional[str] = None

    class Config:
        from_attributes = True

class GoalStatusResponse(Goal):
    # tasks are already included in Goal model
    pass
