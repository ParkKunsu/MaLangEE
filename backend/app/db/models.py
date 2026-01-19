from sqlalchemy import Column, String, Float, Integer, ForeignKey, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    """사용자 테이블"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String, unique=True, index=True, nullable=False) # 아이디 (login_id)
    hashed_password = Column(String, nullable=False) # 암호화된 비밀번호
    nickname = Column(String, nullable=False) # 닉네임
    is_active = Column(Boolean, default=True) # 활성 상태
    
    # Audit Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    sessions = relationship("ConversationSession", back_populates="owner")

class ScenarioDefinition(Base):
    """
    공유 주제(시나리오) 정의 테이블 (메뉴판)
    """
    __tablename__ = "scenario_definitions"
    
    id = Column(String, primary_key=True) # e.g. "airport_01"
    title = Column(String, nullable=False) # e.g. "공항 체크인"
    description = Column(Text, nullable=True)
    
    # [Refactor] Structural Columns for Prompt Template
    place = Column(String, nullable=True) # e.g. "Airport Check-in Counter"
    partner = Column(String, nullable=True) # e.g. "Airport Staff"
    goal = Column(String, nullable=True) # e.g. "Get a window seat"
    
    level = Column(Integer, default=1)
    category = Column(String, nullable=True) # e.g. "Travel"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 1:N 관계 (시나리오 -> 세션들)
    sessions = relationship("ConversationSession", back_populates="scenario_definition")

class ConversationSession(Base):
    """대화 세션 테이블"""
    __tablename__ = "conversation_sessions"

    session_id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=True)
    
    # [New] Linked Scenario
    scenario_id = Column(String, ForeignKey("scenario_definitions.id"), nullable=True)
    scenario_definition = relationship("ScenarioDefinition", back_populates="sessions")

    started_at = Column(String, nullable=False)
    ended_at = Column(String, nullable=False)
    
    total_duration_sec = Column(Float, default=0.0)
    user_speech_duration_sec = Column(Float, default=0.0)

    scenario_place = Column(String, nullable=True)
    scenario_partner = Column(String, nullable=True)
    scenario_goal = Column(String, nullable=True)
    scenario_state_json = Column(Text, nullable=True)
    scenario_completed_at = Column(DateTime(timezone=True), nullable=True)
    scenario_completed_at = Column(DateTime(timezone=True), nullable=True)
    deleted = Column(Boolean, default=False)

    # [New] Feedback & Summary
    feedback = Column(Text, nullable=True) # Top 3 피드백 (JSON string or Plain Text)
    scenario_summary = Column(Text, nullable=True) # 시나리오 요약 (English 1 line)
    
    # Analytics State
    is_analyzed = Column(Boolean, default=False) # 통계 집계 완료 여부
    
    # [New] User Preferences
    voice = Column(String, nullable=True)
    show_text = Column(Boolean, nullable=True)
    
    # Audit Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 1:N 관계 설정 (한 세션에 여러 메시지)
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

    # 1:1 관계 설정 (사용자가 세션을 소유하는 경우)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # 익명 대화 가능성 고려하여 Nullable
    owner = relationship("User", back_populates="sessions")

class ChatMessage(Base):
    """개별 메시지 테이블"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("conversation_sessions.session_id"), nullable=False, index=True)
    
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    duration_sec = Column(Float, default=0.0)

    session = relationship("ConversationSession", back_populates="messages")
