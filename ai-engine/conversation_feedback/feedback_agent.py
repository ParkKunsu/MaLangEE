import logging
from pathlib import Path

import yaml
from .feedback_tools import all_tools
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from app.core.config import settings

logger = logging.getLogger(__name__)

"""
feedback_agent.py - 영어 학습 피드백 ReAct Agent

[역할]
학습자의 영어 대화를 분석하여 문법, 시제, 어휘, 표현 오류를 찾고
피드백을 생성하는 ReAct Agent입니다.

[동작 방식]
1. 학습자(learner) 문장을 하나씩 분석
2. 오류 유형에 따라 적절한 도구(tool) 호출
3. 모든 분석 후 TOP 3 요약 생성
"""

# 프롬프트 파일 경로
PROMPTS_PATH = Path(__file__).parent / "feedback_prompts.yaml"


def _load_prompts() -> dict:
    """
    외부 YAML 파일에서 프롬프트를 로드합니다.

    Returns:
        프롬프트 딕셔너리
    """
    try:
        with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
            prompts = yaml.safe_load(f)
            logger.info(f"프롬프트 파일 로드 완료: {PROMPTS_PATH}")
            return prompts
    except FileNotFoundError:
        logger.error(f"프롬프트 파일을 찾을 수 없음: {PROMPTS_PATH}")
        return {}


def _create_agent():
    """
    ReAct Agent를 생성합니다.

    Returns:
        생성된 ReAct Agent 인스턴스
    """
    llm = ChatOpenAI(model=settings.OPENAI_MODEL, api_key=settings.OPENAI_API_KEY)
    prompts = _load_prompts()
    system_prompt = prompts.get("agent_system", "")

    logger.info("ReAct Agent 생성 중...")

    agent = create_react_agent(
        model=llm,
        tools=all_tools,
        prompt=system_prompt,
    )

    logger.info("ReAct Agent 생성 완료")
    return agent


# Agent 인스턴스 생성 (모듈 로드 시 1회)
agent = _create_agent()
