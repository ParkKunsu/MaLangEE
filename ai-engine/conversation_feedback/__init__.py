"""
conversation_feedback - 대화 후 피드백 생성 패키지

[역할]
영어 학습 대화 세션을 분석하여 학습자의 문법, 시제, 어휘, 표현 오류에 대한
피드백을 생성합니다.

[사용법]
from conversation_feedback import generate_feedback

result = generate_feedback(messages, session_id)
"""
from .feedback_service import generate_feedback

__all__ = ["generate_feedback"]
