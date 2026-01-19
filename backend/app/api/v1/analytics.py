from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.db import models
from app.db.database import get_db
from app.analytics.models import ScenarioStatistics, SessionAnalytics
from app.schemas.analytics import ScenarioStatsResponse
from app.schemas.chat import SessionAnalyticsSchema

router = APIRouter()

@router.get("/user/me", response_model=List[SessionAnalyticsSchema], summary="내 학습 통계 조회 (최근 10개)")
async def get_my_stats(
    current_user: models.User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    로그인한 사용자의 최근 10개 세션별 학습 통계(성적표)를 조회합니다.
    """
    stmt = (
        select(SessionAnalytics)
        .where(SessionAnalytics.user_id == current_user.id)
        .order_by(SessionAnalytics.created_at.desc())
        .limit(10)
    )
    result = await db.execute(stmt)
    analytics_list = result.scalars().all()
    
    return analytics_list

@router.get("/scenario/{scenario_id}", response_model=ScenarioStatsResponse, summary="시나리오 커뮤니티 통계 조회")
async def get_scenario_stats(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    # 시나리오 통계는 비회원도 볼 수 있게 할지 결정 필요. 일단 인증 없이 오픈.
):
    """
    특정 주제(시나리오)의 커뮤니티 평균 통계를 조회합니다.
    (예: 이 주제에서 사람들이 가장 많이 쓴 단어 TOP 20)
    """
    stmt = select(ScenarioStatistics).where(ScenarioStatistics.scenario_id == scenario_id)
    result = await db.execute(stmt)
    stat = result.scalars().first()
    
    if not stat:
        # 데이터가 없으면 기본값 반환
        return ScenarioStatsResponse(
            scenario_id=scenario_id,
            total_plays=0,
            avg_turns=0.0,
            top_keywords={}
        )
        
    return stat
