"""
feedback_service.py - 대화 후 피드백 생성 서비스

[역할]
영어 학습 대화 세션을 분석하여 학습자의 문법, 시제, 어휘, 표현 오류에 대한
피드백을 생성합니다.

[주요 기능]
1. DB에서 대화 세션 조회 후 피드백 생성 (generate_feedback)
2. 메시지 리스트를 직접 받아 피드백 생성 (generate_feedback_from_messages)
"""
import logging
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

sys.path.append("/home/kunsu/Work/inner_circle/MaLangEE/backend")

from app.db.models import ConversationSession, ChatMessage
from feedback_agent import agent

logger = logging.getLogger(__name__)


def _convert_messages_to_text(messages: list) -> str:
    """
    메시지 리스트를 Agent 입력 형식으로 변환합니다.

    role 매핑:
    - user → learner (학습자)
    - assistant → tutor (튜터)

    Args:
        messages: ChatMessage 객체 리스트 또는 dict 리스트

    Returns:
        "[learner] 문장\\n[tutor] 문장..." 형식의 텍스트
    """
    lines = []
    for msg in messages:
        # ChatMessage 객체 또는 dict 모두 지원
        role_value = msg.role if hasattr(msg, 'role') else msg['role']
        content_value = msg.content if hasattr(msg, 'content') else msg['content']

        role = "learner" if role_value == "user" else "tutor"
        lines.append(f"[{role}] {content_value}")
    return "\n".join(lines)


def _invoke_agent(conversation_text: str) -> str:
    """
    Agent를 호출하여 피드백을 생성합니다.

    Args:
        conversation_text: 분석할 대화 텍스트

    Returns:
        생성된 피드백 문자열
    """
    result = agent.invoke({
        "messages": [{
            "role": "user",
            "content": f"다음 영어 학습 대화를 분석해주세요:\n\n{conversation_text}"
        }]
    })
    return result["messages"][-1].content


async def get_session_with_messages(db: AsyncSession, session_id: str) -> ConversationSession | None:
    """
    세션과 메시지를 함께 조회합니다.

    Args:
        db: AsyncSession 데이터베이스 세션
        session_id: 조회할 대화 세션 ID

    Returns:
        ConversationSession 객체 또는 None
    """
    result = await db.execute(
        select(ConversationSession)
        .options(selectinload(ConversationSession.messages))
        .where(ConversationSession.session_id == session_id)
    )
    return result.scalar_one_or_none()


async def generate_feedback(db: AsyncSession, session_id: str) -> dict:
    """
    세션 ID로 대화를 가져와서 피드백을 생성합니다.

    DB에서 해당 세션의 모든 메시지를 조회한 후,
    학습자(user)의 발화를 분석하여 오류 피드백을 생성합니다.

    Args:
        db: AsyncSession 데이터베이스 세션
        session_id: 분석할 대화 세션 ID

    Returns:
        {
            "session_id": str,
            "feedback": str,
            "message_count": int
        }

    Raises:
        ValueError: 세션을 찾을 수 없는 경우
    """
    logger.info(f"피드백 생성 시작 - session_id: {session_id}")

    # 1. DB에서 세션과 메시지 조회
    session = await get_session_with_messages(db, session_id)

    if not session:
        logger.warning(f"세션을 찾을 수 없음 - session_id: {session_id}")
        raise ValueError(f"Session {session_id} not found")

    if not session.messages:
        logger.info(f"대화 내용 없음 - session_id: {session_id}")
        return {
            "session_id": session_id,
            "feedback": "대화 내용이 없습니다.",
            "message_count": 0
        }

    logger.info(f"메시지 {len(session.messages)}개 조회됨")

    # 2. 메시지를 Agent 입력 형식으로 변환
    conversation_text = _convert_messages_to_text(session.messages)

    # 3. Agent 호출
    logger.info("Agent 호출 중...")
    feedback = _invoke_agent(conversation_text)

    logger.info(f"피드백 생성 완료 - session_id: {session_id}")

    return {
        "session_id": session_id,
        "feedback": feedback,
        "message_count": len(session.messages)
    }


def generate_feedback_from_messages(messages: list[dict]) -> str:
    """
    메시지 리스트를 직접 받아서 피드백을 생성합니다. (DB 없이)

    실시간 또는 테스트 용도로 DB를 거치지 않고
    직접 메시지 리스트를 전달하여 피드백을 생성합니다.

    Args:
        messages: [{"role": "user"|"assistant", "content": "..."}] 형식의 리스트

    Returns:
        생성된 피드백 문자열
    """
    logger.info(f"피드백 생성 시작 - 메시지 {len(messages)}개")

    # 메시지를 Agent 입력 형식으로 변환
    conversation_text = _convert_messages_to_text(messages)

    # Agent 호출
    logger.info("Agent 호출 중...")
    feedback = _invoke_agent(conversation_text)

    logger.info("피드백 생성 완료")
    return feedback
