from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta
import logging

from sqlalchemy import update, and_

from app.db.database import AsyncSessionLocal
from app.db.models import ConversationSession
from app.core.config import settings

logger = logging.getLogger(__name__)


async def soft_delete_expired_sessions() -> int:
    """
    만료된 게스트 세션을 삭제 처리(deleted=True)합니다.
    - 대상: 로그인하지 않은 유저(user_id IS NULL)
    - 기준: 마지막 수정 시간(updated_at)
    """
    ttl_minutes = settings.SESSION_GUEST_TTL_MINS
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=ttl_minutes)
    
    async with AsyncSessionLocal() as session:
        # 조건: 1) 아직 삭제 안됨 2) 게스트(Owner 없음) 3) 마지막 활동이 TTL 지남
        stmt = (
            update(ConversationSession)
            .where(
                ConversationSession.deleted.is_(False),
                ConversationSession.user_id.is_(None),  # Guest Only
                ConversationSession.updated_at < cutoff,
            )
            .values(deleted=True)
        )
        try:
            result = await session.execute(stmt)
            await session.commit()
            count = result.rowcount or 0
            if count > 0:
                logger.info(f"Cleaned up {count} expired guest sessions (older than {ttl_hours}h).")
            return count
        except Exception as e:
            logger.error(f"Error during session cleanup: {e}")
            await session.rollback()
            return 0


async def run_cleanup_loop(stop_event: asyncio.Event) -> None:
    """
    설정에 따라 백그라운드에서 주기적으로 세션 정리 작업을 수행합니다.
    """
    if not settings.SESSION_CLEANUP_ENABLED:
        logger.info("Session cleanup loop is DISABLED.")
        return

    interval = settings.SESSION_CLEANUP_INTERVAL_SECONDS
    logger.info(f"Starting session cleanup loop (Interval: {interval}s, TTL: {settings.SESSION_GUEST_TTL_HOURS}h)")
    
    while not stop_event.is_set():
        await soft_delete_expired_sessions()
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval)
        except asyncio.TimeoutError:
            continue
        except asyncio.CancelledError:
            break

