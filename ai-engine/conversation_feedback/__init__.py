"""
conversation_feedback - 대화 후 피드백 생성 패키지

[역할]
영어 학습 대화 세션을 분석하여 학습자의 문법, 시제, 어휘, 표현 오류에 대한
피드백을 생성합니다.

[사용법]
from conversation_feedback import generate_feedback, generate_feedback_from_messages

# DB에서 세션 조회 후 피드백 생성
result = await generate_feedback(db, session_id)

# 메시지 리스트 직접 전달
feedback = generate_feedback_from_messages(messages)
"""
from .feedback_service import generate_feedback, generate_feedback_from_messages

__all__ = ["generate_feedback", "generate_feedback_from_messages"]
