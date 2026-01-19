from typing import Dict, Optional
from pydantic import BaseModel

class UserStatsResponse(BaseModel):
    """
    유저 개인 학습 통계 응답 스키마
    """
    user_id: int
    total_spoken_words: int
    vocabulary_size: int
    expression_richness_score: float
    
    class Config:
        from_attributes = True

class ScenarioStatsResponse(BaseModel):
    """
    시나리오(주제)별 커뮤니티 통계 응답 스키마
    """
    scenario_id: str
    total_plays: int
    avg_turns: float
    top_keywords: Dict[str, int] # e.g. {"passport": 150, "ticket": 120}

    class Config:
        from_attributes = True
