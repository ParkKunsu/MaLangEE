# test_cases.py - 테스트 케이스 모음
from agent import agent

# ============================================
# 테스트 케이스 1: 오류 없음 (거의 완벽한 대화)
# ============================================
test_case_1_no_error = [
    {"role": "tutor", "text": "Hi! What did you do yesterday?"},
    {"role": "learner", "text": "I went to school yesterday and met my friend."},

    {"role": "tutor", "text": "That sounds nice! What did you do together?"},
    {"role": "learner", "text": "We played soccer together. It was really fun."},

    {"role": "tutor", "text": "Great! Do you like soccer?"},
    {"role": "learner", "text": "Yes, I like soccer very much. I have been playing for 5 years."},
]

# ============================================
# 테스트 케이스 2: 오류 딱 3개
# ============================================
test_case_2_three_errors = [
    {"role": "tutor", "text": "Hi! What did you do yesterday?"},
    {"role": "learner", "text": "I go to school yesterday."},  # 시제 오류

    {"role": "tutor", "text": "What did you study?"},
    {"role": "learner", "text": "I studied math. It was very difficult."},  # 정상

    {"role": "tutor", "text": "Do you have any hobbies?"},
    {"role": "learner", "text": "I like listen music."},  # 문법 오류 (listening)

    {"role": "tutor", "text": "What kind of music?"},
    {"role": "learner", "text": "I like K-pop. It is very excited."},  # 어휘 오류 (exciting)
]

# ============================================
# 테스트 케이스 3: 오류 3개 초과 (5개 이상)
# ============================================
test_case_3_many_errors = [
    {"role": "tutor", "text": "Hi! What did you do yesterday?"},
    {"role": "learner", "text": "I am go to school yesterday and meet my friend."},  # 시제+문법 오류

    {"role": "tutor", "text": "Can you tell me more about your friend?"},
    {"role": "learner", "text": "He is very funny. I am like him very much."},  # 문법 오류

    {"role": "tutor", "text": "How long have you been friends?"},
    {"role": "learner", "text": "I knowing him since 5 years."},  # 시제+전치사 오류

    {"role": "tutor", "text": "What do you want to do in the future?"},
    {"role": "learner", "text": "I want become doctor. Because I want help people."},  # 관사+to부정사 오류

    {"role": "tutor", "text": "What subjects do you study?"},
    {"role": "learner", "text": "I study biologie and chemestry."},  # 철자 오류

    {"role": "tutor", "text": "Do you have any hobbies?"},
    {"role": "learner", "text": "Yes, I like listen music and watch movie. Yesterday I watched very excited movie."},  # 문법+어휘 오류
]


def run_test(test_name: str, conversations: list):
    """테스트 케이스 실행"""
    print("\n" + "=" * 60)
    print(f"🧪 {test_name}")
    print("=" * 60)

    # 대화를 텍스트로 변환
    conversation_text = "\n".join([f"[{c['role']}] {c['text']}" for c in conversations])

    print("\n📝 대화 내용:")
    print("-" * 40)
    print(conversation_text)
    print("-" * 40)

    # Agent 실행
    print("\n🤖 Agent 분석 중...")

    result = agent.invoke({
        "messages": [{"role": "user", "content": f"다음 영어 학습 대화를 분석해주세요:\n\n{conversation_text}"}]
    })

    # 결과 출력
    print("\n📊 분석 결과:")
    print("-" * 40)
    final_message = result["messages"][-1]
    print(final_message.content)
    print("\n")


def test_no_error():
    """테스트 1: 오류 없음"""
    run_test("테스트 1: 오류 없음 (완벽한 대화)", test_case_1_no_error)


def test_three_errors():
    """테스트 2: 오류 3개"""
    run_test("테스트 2: 오류 딱 3개", test_case_2_three_errors)


def test_many_errors():
    """테스트 3: 오류 5개 이상"""
    run_test("테스트 3: 오류 5개 이상 (TOP 3 선별)", test_case_3_many_errors)


def test_all():
    """모든 테스트 실행"""
    test_no_error()
    test_three_errors()
    test_many_errors()


if __name__ == "__main__":
    import sys

    print("=" * 60)
    print("🎯 영어 학습 피드백 Agent 테스트")
    print("=" * 60)
    print("\n사용법:")
    print("  python test_cases.py 1    # 오류 없음")
    print("  python test_cases.py 2    # 오류 3개")
    print("  python test_cases.py 3    # 오류 5개+")
    print("  python test_cases.py all  # 전체 테스트")
    print()

    if len(sys.argv) < 2:
        choice = input("테스트 선택 (1/2/3/all): ").strip()
    else:
        choice = sys.argv[1]

    if choice == "1":
        test_no_error()
    elif choice == "2":
        test_three_errors()
    elif choice == "3":
        test_many_errors()
    elif choice == "all":
        test_all()
    else:
        print("❌ 잘못된 선택입니다. 1, 2, 3, 또는 all을 입력하세요.")

    print("=" * 60)
    print("✅ 테스트 완료!")
    print("=" * 60)
