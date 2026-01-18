from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, field_validator

class MessageSchema(BaseModel):
    role: str
    content: str
    timestamp: str
    duration_sec: float = 0.0

    class Config:
        from_attributes = True


class SessionBase(BaseModel):
    session_id: str
    title: Optional[str] = None
    started_at: str
    ended_at: str
    total_duration_sec: float
    user_speech_duration_sec: float
    feedback: Optional[str] = None
    scenario_summary: Optional[str] = None

class SessionCreate(SessionBase):
    messages: List[MessageSchema]
    scenario_place: Optional[str] = None
    scenario_partner: Optional[str] = None
    scenario_goal: Optional[str] = None
    scenario_state_json: Optional[Dict[str, Any]] = None
    
    # [Type Note] DB stores as DateTime object. Using 'datetime' ensures correct mapping and Swagger ($date-time).
    scenario_completed_at: Optional[datetime] = None
    deleted: Optional[bool] = None
    voice: Optional[str] = None
    show_text: Optional[bool] = None

class SessionResponse(SessionCreate):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # [Why Validator?] DB stores as TEXT (JSON string) but API exposes as Dict (JSON Object).
    # This parses the string from DB into a Dict for the Frontend/Swagger.
    @field_validator('scenario_state_json', mode='before')
    @classmethod
    def parse_scenario_state_json(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        return v

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
