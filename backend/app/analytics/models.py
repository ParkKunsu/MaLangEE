from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
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


class UserLearningMap(Base):
    """
    유저 개인별 학습 성장 지표
    - 나 vs 집단 비교 분석용
    """
    __tablename__ = "user_learning_map"
    
    # users 테이블의 id를 참조 (User가 삭제되면 통계도 삭제되는게 깔끔하므로 ForeignKey 설정)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    total_spoken_words = Column(Integer, default=0)       # 누적 발화 단어 수
    vocabulary_size = Column(Integer, default=0)          # 사용해본 고유 단어(Unique Words) 개수
    expression_richness_score = Column(Float, default=0.0) # 어휘 다양성 점수 (Type-Token Ratio 등)
    
    last_calculated_at = Column(DateTime(timezone=True), server_default=func.now())
