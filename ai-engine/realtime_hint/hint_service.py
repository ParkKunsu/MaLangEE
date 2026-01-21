"""
hint_service.py - 실시간 대화 힌트 생성 서비스

[역할]
영어 학습 대화 중 사용자가 막힐 때 다음 발화 힌트를 생성합니다.

[주요 기능]
대화 맥락과 시나리오 컨텍스트를 받아 적절한 응답 힌트 3개 생성

[변경 사항]
- LangChain 제거, OpenAI SDK 직접 사용
- LangSmith traceable 데코레이터로 트레이싱
- 프롬프트는 hint_prompts.yaml에서 로드
"""

import json
import logging
import os
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

# 프롬프트 파일 경로
PROMPTS_PATH = Path(__file__).parent / "hint_prompts.yaml"

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


def _format_conversation(messages: list[dict]) -> str:
    """메시지 리스트를 대화 형식으로 변환"""
    lines = []
    for msg in messages:
        role = "Learner" if msg.get("role") == "user" else "Tutor"
        content = msg.get("content", "")
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


def _format_scenario_context(context: dict | None) -> str:
    """시나리오 컨텍스트를 프롬프트용 문자열로 변환"""
    if not context:
        return ""

    parts = []
    if context.get("title"):
        parts.append(f"Topic: {context['title']}")
    if context.get("place"):
        parts.append(f"Place: {context['place']}")
    if context.get("partner"):
        parts.append(f"Speaking with: {context['partner']}")
    if context.get("goal"):
        parts.append(f"Goal: {context['goal']}")

    if parts:
        return "Scenario context:\n" + "\n".join(parts)
    return ""


@traceable(name="generate_hints")
def generate_hints(messages: list[dict], context: dict | None = None) -> list[str]:
    """
    대화 맥락을 받아 힌트 3개를 생성합니다.

    Args:
        messages: [{"role": "user"|"assistant", "content": "..."}] 형식의 리스트
        context: {"title", "place", "partner", "goal"} 시나리오 정보 (선택)

    Returns:
        ["힌트1", "힌트2", "힌트3"] 형식의 리스트
    """
    logger.info(f"힌트 생성 시작 - 메시지 {len(messages)}개")

    if not messages:
        logger.info("대화 내용 없음")
        return []

    try:
        prompts = _load_prompts()
        client = _get_client()

        conversation_text = _format_conversation(messages)
        scenario_context = _format_scenario_context(context)

        system_template = prompts.get("hint_system", "")
        user_template = prompts.get("hint_user", "{conversation}")

        system_prompt = system_template.format(scenario_context=scenario_context)
        user_prompt = user_template.format(conversation=conversation_text)

        logger.info("LLM 호출 중...")
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        result = response.choices[0].message.content

        # JSON 파싱
        hints = json.loads(result)

        if isinstance(hints, list) and len(hints) > 0:
            logger.info(f"힌트 {len(hints)}개 생성 완료")
            return hints[:3]  # 최대 3개

        logger.warning("LLM 응답 파싱 실패, 빈 리스트 반환")
        return []

    except json.JSONDecodeError as e:
        logger.error(f"JSON 파싱 오류: {e}")
        return []
    except Exception as e:
        logger.error(f"힌트 생성 오류: {e}")
        return []
