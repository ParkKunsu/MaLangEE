import logging

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

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


# 초기화 방지: LLM 인스턴스를 전역에서 생성하지 않음
_summary_llm = None
_summary_prompt = None


def _get_summary_tools():
    """LLM 및 프롬프트 Lazy Initialization"""
    global _summary_llm, _summary_prompt
    if _summary_llm is None:
        _summary_llm = ChatOpenAI(model="gpt-4o-mini")
    if _summary_prompt is None:
        _summary_prompt = ChatPromptTemplate.from_messages([
            ("system", "Summarize the following English learning conversation in ONE English sentence. Focus on what topics were practiced."),
            ("user", "{conversation}")
        ])
    return _summary_llm, _summary_prompt


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


def _generate_summary(conversation_text: str) -> str:
    """
    대화 내용을 영어 1문장으로 요약합니다.

    Args:
        conversation_text: 대화 텍스트

    Returns:
        영어 1문장 요약
    """
    llm, prompt = _get_summary_tools()
    chain = prompt | llm
    result = chain.invoke({"conversation": conversation_text})
    return result.content.strip()


def _invoke_agent(conversation_text: str) -> str:
    """
    Agent를 호출하여 피드백을 생성합니다.

    Args:
        conversation_text: 분석할 대화 텍스트

    Returns:
        피드백 텍스트
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
            "scenario_summary": str,  # 대화 내용 영어 1줄 요약
            "feedback": str,          # TOP 3 피드백
            "message_count": int
        }
    """
    logger.info(f"피드백 생성 시작 - session_id: {session_id}, 메시지 {len(messages)}개")

    if not messages:
        logger.info("대화 내용 없음")
        return {
            "session_id": session_id,
            "scenario_summary": "",
            "feedback": "대화 내용이 없습니다.",
            "message_count": 0,
        }

    # 메시지를 Agent 입력 형식으로 변환
    conversation_text = _convert_messages_to_text(messages)

    # 1. 대화 요약 생성 (별도 LLM 호출)
    logger.info("대화 요약 생성 중...")
    scenario_summary = _generate_summary(conversation_text)

    # 2. Agent 호출 (피드백 생성)
    logger.info("Agent 호출 중...")
    feedback = _invoke_agent(conversation_text)

    logger.info(f"피드백 생성 완료 - session_id: {session_id}")

    return {
        "session_id": session_id,
        "scenario_summary": scenario_summary,
        "feedback": feedback,
        "message_count": len(messages),
    }
