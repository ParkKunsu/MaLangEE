from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.models import Base

class ScenarioStatistics(Base):
    """
    시나리오별 집단지성 통계 데이터
    - 트렌드 파악용 (많이 쓰는 단어, 평균 턴 수 등)
    """
    __tablename__ = "scenario_statistics"
    
    # 시나리오를 구분하는 고유 ID (예: 'cafe_order', 'airport_checkin')
    # 현재 별도 Scenario 테이블이 없으므로 Frontend에서 사용하는 ID를 그대로 키로 사용
    scenario_id = Column(String, primary_key=True, index=True)
    
    total_plays = Column(Integer, default=0)       # 총 플레이 횟수
    avg_turns = Column(Float, default=0.0)         # 세션당 평균 대화 턴 수
    
    # {"word": count, ...} 형태의 Top 20 단어 (Word Cloud용)
    # JSON 타입은 MySQL 5.7+, PostgreSQL, SQLite(Text로 저장됨) 등에서 지원
    top_keywords = Column(JSON, nullable=True) 
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SessionAnalytics(Base):
    """
    세션별 학습 통계 데이터 (Per-Session Analytics)
    - 각 대화 세션의 분석 결과 (단어 수, 다양성 점수 등)를 저장
    - 누적 데이터가 아닌 개별 이력 데이터
    """
    __tablename__ = "session_analytics"
    
    # 세션 ID (1:1 관계)
    session_id = Column(String, ForeignKey("conversation_sessions.session_id", ondelete="CASCADE"), primary_key=True)
    
    # 조회 편의성을 위한 User ID 역정규화 (Index 설정)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    
    word_count = Column(Integer, default=0)         # 총 발화 단어 수
    unique_words_count = Column(Integer, default=0) # 고유 단어 수
    richness_score = Column(Float, default=0.0)     # 어휘 다양성 점수 (0~100)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    session = relationship("ConversationSession", back_populates="analytics")
