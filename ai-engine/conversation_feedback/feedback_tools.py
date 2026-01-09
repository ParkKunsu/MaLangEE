"""
feedback_tools.py - 영어 학습 피드백 도구들

[역할]
ReAct Agent가 사용하는 피드백 생성 도구들을 정의합니다.
각 도구는 특정 유형의 오류를 분석하고 수정 제안을 생성합니다.

[도구 목록]
- grammar_fixer: 문법 오류 수정
- tense_corrector: 시제 오류 수정
- vocabulary_suggester: 어휘/철자 오류 수정
- expression_improver: 표현 개선
- generate_summary: TOP 3 요약 생성
"""
import logging
import yaml
from pathlib import Path

from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)

# 프롬프트 로드
PROMPTS_PATH = Path(__file__).parent / "feedback_prompts.yaml"
try:
    with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
        PROMPTS = yaml.safe_load(f)
    logger.info(f"프롬프트 파일 로드 완료: {PROMPTS_PATH}")
except FileNotFoundError:
    logger.error(f"프롬프트 파일을 찾을 수 없음: {PROMPTS_PATH}")
    PROMPTS = {}

llm = ChatOpenAI(model="gpt-4o")


def _get_prompt(tool_name: str) -> ChatPromptTemplate:
    """
    YAML에서 도구별 프롬프트를 가져옵니다.

    Args:
        tool_name: 도구 이름 (grammar_fixer, tense_corrector 등)

    Returns:
        ChatPromptTemplate 객체
    """
    p = PROMPTS[tool_name]
    return ChatPromptTemplate.from_messages([
        ("system", p["system"].strip()),
        ("user", p["user"])
    ])


@tool
def grammar_fixer(sentence: str) -> str:
    """
    문법 오류를 수정하고 설명합니다.
    주어-동사 일치, 관사, 전치사 등의 문법 오류를 찾아 수정합니다.

    Args:
        sentence: 분석할 영어 문장
    """
    logger.info(f"grammar_fixer 호출: {sentence[:50]}...")
    chain = _get_prompt("grammar_fixer") | llm | StrOutputParser()
    return chain.invoke({"sentence": sentence})


@tool
def tense_corrector(sentence: str) -> str:
    """
    시제 오류를 수정합니다.
    과거/현재/미래/완료 시제의 잘못된 사용을 찾아 수정합니다.

    Args:
        sentence: 분석할 영어 문장
    """
    logger.info(f"tense_corrector 호출: {sentence[:50]}...")
    chain = _get_prompt("tense_corrector") | llm | StrOutputParser()
    return chain.invoke({"sentence": sentence})


@tool
def vocabulary_suggester(sentence: str) -> str:
    """
    더 적절하거나 자연스러운 어휘를 제안합니다.
    철자 오류, 어색한 단어 선택을 수정합니다.

    Args:
        sentence: 분석할 영어 문장
    """
    logger.info(f"vocabulary_suggester 호출: {sentence[:50]}...")
    chain = _get_prompt("vocabulary_suggester") | llm | StrOutputParser()
    return chain.invoke({"sentence": sentence})


@tool
def expression_improver(sentence: str) -> str:
    """
    어색한 표현을 자연스러운 영어 표현으로 개선합니다.
    직역체나 한국식 영어를 원어민스러운 표현으로 바꿉니다.

    Args:
        sentence: 분석할 영어 문장
    """
    logger.info(f"expression_improver 호출: {sentence[:50]}...")
    chain = _get_prompt("expression_improver") | llm | StrOutputParser()
    return chain.invoke({"sentence": sentence})


@tool
def generate_summary(feedbacks: str) -> str:
    """
    모든 피드백을 종합하여 가장 중요한 3개 문장만 선별하여 피드백을 생성합니다.

    Args:
        feedbacks: 지금까지 생성된 모든 피드백 내용
    """
    logger.info("generate_summary 호출: TOP 3 요약 생성")
    chain = _get_prompt("generate_summary") | llm | StrOutputParser()
    return chain.invoke({"feedbacks": feedbacks})


# 사용 가능한 도구 목록
all_tools = [
    grammar_fixer,
    tense_corrector,
    vocabulary_suggester,
    expression_improver,
    generate_summary,
]
