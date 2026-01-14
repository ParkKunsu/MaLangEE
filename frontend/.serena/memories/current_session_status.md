# 현재 세션 상태 (2026-01-14)

## 완료된 작업

### 1. WebSocket 실제 LLM 연결 구현
- `src/features/chat/hook/useScenarioChat.ts` 생성
- 실제 백엔드 WebSocket (`ws://49.50.137.35:8080/api/v1/ws/scenario`) 연결
- PCM16 오디오 변환 및 재생 기능 구현
- React Strict Mode 대응 (connectionId로 stale closure 방지)

### 2. Conversation 페이지 업데이트
- `src/app/chat/conversation/page.tsx` 실제 WebSocket 사용하도록 변경
- 마이크 녹음 → WebSocket 전송 → AI 응답 수신 흐름 구현
- 연결 상태 표시 및 디버그 컨트롤 추가

### 3. 불필요한 페이지/기능 제거
- ❌ `/dashboard` 제거
- ❌ `/quick-response` 제거
- ❌ `/think-aloud` 제거
- ❌ `/daily-reflection` 제거
- ❌ `/rephrasing` 제거
- ❌ `/progress` 제거
- 관련 features/widgets 폴더도 제거

### 4. 라우팅 변경
- 로그인 후 `/chat-history`로 이동 (완료)

## 현재 유지되는 페이지
- `/` - 랜딩
- `/auth/login` - 로그인
- `/auth/signup` - 회원가입
- `/auth/scenario-select` - 시나리오 선택
- `/chat-history` - 대화 기록 (로그인 후 메인)
- `/chat/conversation` - 시나리오 대화 (WebSocket LLM 연결)
- `/chat/complete` - 대화 완료
- `/chat/voice-selection` - 음성 선택
- `/chat/subtitle-settings` - 자막 설정
- `/chat/welcome-back` - 재방문 환영
- `/topic-select` - 주제 선택
- `/logout` - 로그아웃

## 진행 중인 작업
- Figma 디자인 분석 및 문서화 (Figma API rate limit으로 대기 중)

## 기술 스택
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- WebSocket for real-time LLM communication
- TanStack React Query v5

## WebSocket 연결 정보
- URL: `ws://49.50.137.35:8080/api/v1/ws/scenario?token={access_token}`
- Guest: `ws://49.50.137.35:8080/api/v1/ws/guest-scenario`
