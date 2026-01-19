from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ScenarioBase(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    place: Optional[str] = None
    partner: Optional[str] = None
    goal: Optional[str] = None
    level: int = 1
    category: Optional[str] = None

class ScenarioCreate(ScenarioBase):
    pass # No extra fields for now

class ScenarioResponse(ScenarioBase):
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
