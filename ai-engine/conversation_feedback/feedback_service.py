import logging

from .feedback_agent import agent

logger = logging.getLogger(__name__)

"""
feedback_service.py - 대화 후 피드백 생성 서비스

[역할]
영어 학습 대화 세션을 분석하여 학습자의 문법, 시제, 어휘, 표현 오류에 대한
피드백을 생성합니다.

[주요 기능]
Backend 서비스에서 메시지 리스트를 전달받아 피드백 생성 (generate_feedback)
"""


def _convert_messages_to_text(messages: list) -> str:
    """
    메시지 리스트를 Agent 입력 형식으로 변환합니다.

    role 매핑:
    - user → learner (학습자)
    - assistant → tutor (튜터)

    Args:
        messages: dict 리스트 [{"role": "...", "content": "..."}]

    Returns:
        "[learner] 문장\\n[tutor] 문장..." 형식의 텍스트
    """
    lines = []
    for msg in messages:
        role_value = msg["role"]
        content_value = msg["content"]

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
    result = agent.invoke({"messages": [{"role": "user", "content": f"다음 영어 학습 대화를 분석해주세요:\n\n{conversation_text}"}]})
    return result["messages"][-1].content


def generate_feedback(messages: list[dict], session_id: str | None = None) -> dict:
    """
    Backend 서비스에서 전달받은 메시지로 피드백을 생성합니다.

    Args:
        messages: [{"role": "user"|"assistant", "content": "..."}] 형식의 리스트
        session_id: (선택) 세션 ID - 응답에 포함됨

    Returns:
        {
            "session_id": str | None,
            "feedback": str,
            "message_count": int
        }
    """
    logger.info(f"피드백 생성 시작 - session_id: {session_id}, 메시지 {len(messages)}개")

    if not messages:
        logger.info("대화 내용 없음")
        return {"session_id": session_id, "feedback": "대화 내용이 없습니다.", "message_count": 0}

    # 메시지를 Agent 입력 형식으로 변환
    conversation_text = _convert_messages_to_text(messages)

    # Agent 호출
    logger.info("Agent 호출 중...")
    feedback = _invoke_agent(conversation_text)

    logger.info(f"피드백 생성 완료 - session_id: {session_id}")

    return {"session_id": session_id, "feedback": feedback, "message_count": len(messages)}
