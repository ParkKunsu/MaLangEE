# Conversation Feedback

영어 학습 대화를 분석하여 문법, 시제, 어휘, 표현 오류에 대한 피드백을 생성하는 ReAct Agent 기반 모듈입니다.

## 구조

```
conversation_feedback/
├── __init__.py           # 패키지 진입점
├── feedback_agent.py     # ReAct Agent 생성
├── feedback_service.py   # 피드백 생성 서비스
├── feedback_tools.py     # 분석 도구 정의
├── feedback_prompts.yaml # 프롬프트 설정
└── test_cases.py         # 테스트 케이스
```

## 주요 기능

### 분석 도구 (Tools)

| 도구 | 설명 |
|------|------|
| `grammar_fixer` | 주어-동사 일치, 관사, 전치사 등 문법 오류 수정 |
| `tense_corrector` | 과거/현재/미래/완료 시제 오류 수정 |
| `vocabulary_suggester` | 철자 오류 및 어색한 어휘 수정 |
| `expression_improver` | 직역체/한국식 영어를 자연스러운 표현으로 개선 |
| `generate_summary` | 분석 결과를 종합하여 TOP 3 피드백 생성 |

### 동작 방식

1. 학습자(learner) 문장을 하나씩 분석
2. 오류 유형에 따라 적절한 도구 호출
3. 모든 분석 후 TOP 3 요약 생성

## 사용법

### DB 세션 기반 피드백 생성

```python
from conversation_feedback import generate_feedback

# AsyncSession과 session_id로 피드백 생성
result = await generate_feedback(db, session_id)

# 반환값
# {
#     "session_id": str,
#     "feedback": str,
#     "message_count": int
# }
```

### 메시지 리스트 직접 전달

```python
from conversation_feedback import generate_feedback_from_messages

messages = [
    {"role": "user", "content": "I go to school yesterday."},
    {"role": "assistant", "content": "That's great! What did you do there?"},
    {"role": "user", "content": "I study English very hardly."},
]

feedback = generate_feedback_from_messages(messages)
```

## 기술 스택

- **LLM**: OpenAI GPT-4o (테스트용)
- **Framework**: LangChain, LangGraph
- **Agent**: LangGraph ReAct Agent
- **DB**: SQLAlchemy (AsyncSession)

## 피드백 출력 예시

```
📌 **1. 첫 번째 수정**
- 원문: I go to school yesterday.
- 수정: I went to school yesterday.
- 설명: yesterday는 과거를 나타내므로 과거 시제 went를 사용해야 합니다.

📌 **2. 두 번째 수정**
- 원문: I study English very hardly.
- 수정: I studied English very hard.
- 설명: hardly는 "거의 ~않다"라는 의미이고, "열심히"는 hard를 사용합니다.
```

## 환경 설정

```bash
# OpenAI API 키 설정 필요
export OPENAI_API_KEY=your-api-key
```

## TODO

- .env 파일 작성
- 입력(session id)받아서 db 조회
