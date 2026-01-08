from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class MessageSchema(BaseModel):
    role: str
    content: str
    timestamp: str
    duration_sec: float = 0.0


class SessionBase(BaseModel):
    session_id: str
    title: Optional[str] = None
    started_at: str
    ended_at: str
    total_duration_sec: float
    user_speech_duration_sec: float

class SessionCreate(SessionBase):
    messages: List[MessageSchema]

class SessionResponse(SessionCreate):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SessionSummary(SessionBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    message_count: int

    class Config:
        from_attributes = True

class SyncSessionResponse(BaseModel):
    """
    세션 동기화 응답 스키마
    """
    status: str
    session_id: str

class HintResponse(BaseModel):
    """
    힌트 생성 응답 스키마
    """
    hints: List[str]
    session_id: str
