import json
import logging
import os
import re
from pathlib import Path

import yaml
from openai import OpenAI
from langsmith import traceable, wrappers

from app.core.config import settings

# LangSmith 트레이싱 설정
if settings.LANGCHAIN_TRACING_V2 and settings.LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
    logging.getLogger(__name__).info(f"LangSmith 트레이싱 활성화: {settings.LANGCHAIN_PROJECT}")

logger = logging.getLogger(__name__)

"""
feedback_service.py - 대화 후 피드백 생성 서비스 (단순화 버전)

[역할]
영어 학습 대화 세션을 분석하여 학습자의 문법, 시제, 어휘, 표현 오류에 대한
피드백을 생성합니다.

[변경 사항]
- LangChain 제거, OpenAI SDK 직접 사용
- LangSmith traceable 데코레이터로 트레이싱
- 프롬프트는 feedback_prompts.yaml에서 로드
"""

# 프롬프트 파일 경로
PROMPTS_PATH = Path(__file__).parent / "feedback_prompts.yaml"

# OpenAI 클라이언트 (Lazy Initialization)
_client = None
_prompts = None


def _load_prompts() -> dict:
    """YAML 파일에서 프롬프트를 로드합니다."""
    global _prompts
    if _prompts is None:
        try:
            with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
                _prompts = yaml.safe_load(f)
                logger.info(f"프롬프트 파일 로드 완료: {PROMPTS_PATH}")
        except FileNotFoundError:
            logger.error(f"프롬프트 파일을 찾을 수 없음: {PROMPTS_PATH}")
            _prompts = {}
    return _prompts


def _get_client() -> OpenAI:
    """OpenAI 클라이언트 Lazy Initialization (LangSmith 래핑)"""
    global _client
    if _client is None:
        base_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        # LangSmith 트레이싱이 활성화된 경우 래핑
        if settings.LANGCHAIN_TRACING_V2 and settings.LANGCHAIN_API_KEY:
            _client = wrappers.wrap_openai(base_client)
        else:
            _client = base_client
    return _client


def _convert_messages_to_text(messages: list) -> str:
    """
    메시지 리스트를 분석용 텍스트로 변환합니다.

    role 매핑:
    - user → learner (학습자)
    - assistant → tutor (튜터)

    Args:
        messages: dict 리스트 [{"id": int, "role": "...", "content": "..."}]

    Returns:
        "[learner:123] 문장\\n[tutor:124] 문장..." 형식의 텍스트
        ID가 없는 경우 "[learner] 문장" 형식으로 출력
    """
    lines = []
    for msg in messages:
        role_value = msg["role"]
        content_value = msg["content"]
        msg_id = msg.get("id")

        role = "learner" if role_value == "user" else "tutor"
        if msg_id is not None:
            lines.append(f"[{role}:{msg_id}] {content_value}")
        else:
            lines.append(f"[{role}] {content_value}")
    return "\n".join(lines)


@traceable(name="generate_summary")
def _generate_summary(conversation_text: str) -> str:
    """
    대화 내용을 영어 1문장으로 요약합니다.

    Args:
        conversation_text: 대화 텍스트

    Returns:
        영어 1문장 요약
    """
    prompts = _load_prompts()
    client = _get_client()

    system_prompt = prompts.get("summary_system", "Summarize the conversation in ONE English sentence.")
    user_prompt = prompts.get("summary_user", "{conversation}").format(conversation=conversation_text)

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content.strip()


@traceable(name="analyze_feedback")
def _analyze_feedback(conversation_text: str) -> dict:
    """
    대화를 분석하여 피드백 JSON을 생성합니다.

    Args:
        conversation_text: 분석할 대화 텍스트

    Returns:
        {
            "summary": str,
            "feedback_top3_ids": [int],
            "feedback_details": [...]
        }
    """
    prompts = _load_prompts()
    client = _get_client()

    system_prompt = prompts.get("feedback_system", "")
    user_prompt = prompts.get("feedback_user", "{conversation}").format(conversation=conversation_text)

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return _parse_response(response.choices[0].message.content)


def _parse_response(llm_output: str) -> dict:
    """
    LLM 출력에서 JSON을 파싱합니다.

    Args:
        llm_output: LLM이 반환한 텍스트

    Returns:
        파싱된 딕셔너리, 실패 시 기본값 반환
    """
    # JSON 블록 추출 (```json ... ``` 또는 { ... })
    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', llm_output)

    if json_match:
        json_str = json_match.group(1)
    else:
        # ```json 없이 바로 JSON인 경우
        json_match = re.search(r'\{[\s\S]*"feedback_details"[\s\S]*\}', llm_output)
        if json_match:
            json_str = json_match.group(0)
        else:
            logger.warning("LLM 출력에서 JSON을 찾을 수 없음")
            return {
                "feedback_top3_ids": [],
                "feedback_details": []
            }

    try:
        parsed = json.loads(json_str)
        return {
            "feedback_top3_ids": parsed.get("feedback_top3_ids", []),
            "feedback_details": parsed.get("feedback_details", [])
        }
    except json.JSONDecodeError as e:
        logger.warning(f"JSON 파싱 실패: {e}")
        return {
            "feedback_top3_ids": [],
            "feedback_details": []
        }


@traceable(name="generate_feedback")
def generate_feedback(messages: list[dict], session_id: str | None = None) -> dict:
    """
    Backend 서비스에서 전달받은 메시지로 피드백을 생성합니다.

    Args:
        messages: [{"id": int, "role": "user"|"assistant", "content": "..."}] 형식의 리스트
        session_id: (선택) 세션 ID - 응답에 포함됨

    Returns:
        {
            "session_id": str | None,
            "scenario_summary": str,  # 대화 내용 영어 1줄 요약
            "message_count": int,
            "feedback_top3_ids": [int],  # TOP 3 메시지 ID 리스트
            "feedback_details": [     # 메시지별 상세 피드백
                {
                    "message_id": int,
                    "fb_before": str,
                    "fb_content": str,
                    "fb_after": str
                }
            ]
        }
    """
    logger.info(f"피드백 생성 시작 - session_id: {session_id}, 메시지 {len(messages)}개")

    if not messages:
        logger.info("대화 내용 없음")
        return {
            "session_id": session_id,
            "scenario_summary": "",
            "message_count": 0,
            "feedback_top3_ids": [],
            "feedback_details": [],
        }

    # 메시지를 분석용 텍스트로 변환 (ID 포함)
    conversation_text = _convert_messages_to_text(messages)

    # 1. 대화 요약 생성
    logger.info("대화 요약 생성 중...")
    scenario_summary = _generate_summary(conversation_text)

    # 2. 피드백 분석 (단일 LLM 호출)
    logger.info("피드백 분석 중...")
    analysis_result = _analyze_feedback(conversation_text)

    logger.info(f"피드백 생성 완료 - session_id: {session_id}, 상세 피드백 {len(analysis_result['feedback_details'])}개, TOP3: {analysis_result['feedback_top3_ids']}")

    return {
        "session_id": session_id,
        "scenario_summary": scenario_summary,
        "message_count": len(messages),
        "feedback_top3_ids": analysis_result["feedback_top3_ids"],
        "feedback_details": analysis_result["feedback_details"],
    }
