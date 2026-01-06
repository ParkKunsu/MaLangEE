from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.models import ConversationSession, ChatMessage
from app.schemas.chat import SessionCreate

class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session_log(self, session_data: SessionCreate, user_id: int = None) -> ConversationSession:
        # 1. Check if session exists
        stmt = select(ConversationSession).where(ConversationSession.session_id == session_data.session_id).options(selectinload(ConversationSession.messages))
        result = await self.db.execute(stmt)
        db_session = result.scalars().first()

        if db_session:
            # [UPDATE]
            db_session.title = session_data.title
            db_session.started_at = session_data.started_at
            db_session.ended_at = session_data.ended_at
            
            # [Accumulate] 시간 누적 (기존 시간 + 이번 세션 시간)
            # Tracker는 이번 연결의 시간만 계산해서 보내주므로, DB에는 계속 더해야 함
            db_session.total_duration_sec += session_data.total_duration_sec
            db_session.user_speech_duration_sec += session_data.user_speech_duration_sec
            
            if user_id is not None:
                db_session.user_id = user_id
            
            # 기존 메시지는 유지하고, 새로운 메시지만 추가 (Append Only)
            # 가정: session_data.messages는 항상 전체 히스토리를 담고 있음
            existing_count = len(db_session.messages)
            new_messages = session_data.messages[existing_count:]
            
            for msg in new_messages:
                db_msg = ChatMessage(
                    session_id=session_data.session_id,
                    role=msg.role,
                    content=msg.content,
                    timestamp=msg.timestamp,
                    duration_sec=msg.duration_sec
                )
                db_session.messages.append(db_msg)
        else:
            # [INSERT]
            db_session = ConversationSession(
                session_id=session_data.session_id,
                title=session_data.title,
                started_at=session_data.started_at,
                ended_at=session_data.ended_at,
                total_duration_sec=session_data.total_duration_sec,
                user_speech_duration_sec=session_data.user_speech_duration_sec,
                user_id=user_id
            )
            self.db.add(db_session)
            
            # Add All Messages
            for msg in session_data.messages:
                db_msg = ChatMessage(
                    session_id=session_data.session_id,
                    role=msg.role,
                    content=msg.content,
                    timestamp=msg.timestamp,
                    duration_sec=msg.duration_sec
                )
                db_session.messages.append(db_msg)
        
        await self.db.commit()
        await self.db.refresh(db_session)
        return db_session

    async def get_recent_session_by_user(self, user_id: int) -> Optional[ConversationSession]:
        stmt = (
            select(ConversationSession)
            .where(ConversationSession.user_id == user_id)
            .order_by(ConversationSession.ended_at.desc())
            .options(selectinload(ConversationSession.messages))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_session_by_id(self, session_id: str, user_id: int) -> Optional[ConversationSession]:
        stmt = (
            select(ConversationSession)
            .where(
                ConversationSession.session_id == session_id,
                ConversationSession.user_id == user_id
            )
            .options(selectinload(ConversationSession.messages))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()
