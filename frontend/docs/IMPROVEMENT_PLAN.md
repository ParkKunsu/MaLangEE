# MaLangEE 웹사이트 개선 실행 계획

> **프로젝트 개요**: AI 기반 실시간 영어 회화 학습 플랫폼
> **핵심 목표**: 초저지연(0.5초 이내) 실시간 음성 대화 및 피드백
> **기술 스택**: Next.js 16 + React 19 + TypeScript, Tailwind CSS v4 + shadcn/ui, FastAPI WebSocket

---

## 현재 상태 분석 (2025-01-20 업데이트)

### 완료된 기능
- 랜딩 페이지 (/)
- 로그인/회원가입 페이지 (/auth/login, /auth/signup)
- 시나리오 선택 페이지 (/scenario-select)
- 대시보드 페이지 (/dashboard)
- 토픽 선택 페이지 (/topic-select)
- 인증 시스템 (JWT, GuestGuard, AuthGuard)
- **WebSocket 연동 (시나리오/대화 모드 모두 구현 완료)**
- **음성 녹음/재생 기능 (PCM16, 24kHz)**

### 개선이 필요한 영역
1. **코드 구조**: FSD 아키텍처 일부 영역 추가 필요 (entities, widgets)
2. **UI/UX**: 반응형 디자인, 접근성, 애니메이션 개선
3. ~~**핵심 기능**: WebSocket 연동, 음성 녹음/재생 기능~~ ✅ 완료
4. **테스트**: E2E 테스트 부재, 단위 테스트 보강 필요
5. **접근성**: WCAG 가이드라인 준수 필요

---

## Phase 1: 기초 코드 품질 및 FSD 구조 개선

### 오버뷰
프로젝트의 기반을 다지는 단계입니다. FSD(Feature-Sliced Design) 아키텍처를 완전히 적용하고, 코드 품질을 향상시키며, 공용 컴포넌트를 정리합니다.

### 컨텍스트
- **현재 상태**: FSD 구조 부분 적용됨 (features/auth, features/chat 구현 완료)
- **목표 상태**: entities, widgets 레이어 구축 및 모든 기능이 FSD 슬라이스로 구조화
- **작업 디렉토리**: `/frontend/src/`
- **참고 문서**: `/frontend/docs/tailwind.md`, `/frontend/CLAUDE.md`

### 수정/개선 체크리스트

#### shared 레이어 정리
- [x] `shared/ui/` - 공용 UI 컴포넌트 인덱스 파일 정리 및 re-export 구조화 (18개 컴포넌트)
- [x] `shared/ui/Button.tsx` - brand, brand-outline variant 구현 완료
- [x] `shared/ui/MicButton/` - 마이크 버튼 컴포넌트 구현
- [x] `shared/ui/GlassCard/` - 글래스모피즘 카드 컴포넌트 구현
- [x] `shared/lib/utils.ts` - cn 함수 및 유틸리티 함수 구현
- [ ] `shared/types/` - 공용 타입 정의 (ApiResponse, PaginatedResponse 등)
- [x] `shared/lib/api-client.ts` - API 클라이언트 설정 완료
- [x] `shared/lib/websocket-client.ts` - WebSocket 클라이언트 구현 완료

#### shared/hooks 구현 상태
- [x] `shared/hooks/useAudioRecorder.ts` - PCM16 오디오 캡처, 24kHz, 볼륨 감지
- [x] `shared/hooks/useInactivityTimer.ts` - 비활성 타이머 훅

#### entities 레이어 구축
- [ ] `entities/user/` - 사용자 엔티티 (model, ui, api)
- [ ] `entities/user/model/user.ts` - User 타입 및 Zod 스키마
- [ ] `entities/user/ui/UserAvatar.tsx` - 사용자 아바타 컴포넌트
- [ ] `entities/scenario/` - 시나리오 엔티티 구조 생성
- [ ] `entities/scenario/model/scenario.ts` - Scenario 타입 (place, partner, goal)

#### features 레이어 확장
- [x] `features/auth/` - 인증 기능 완전 구현 (api, hook, model, ui)
- [x] `features/auth/api/` - useLogin, useRegister, useLogout, useDeleteAccount 등
- [x] `features/auth/hook/` - useAuth, useLoginIdCheck, useNicknameCheck, usePasswordValidation
- [x] `features/auth/model/` - loginSchema, registerSchema, tokenSchema, userSchema 등
- [x] `features/auth/ui/` - AuthGuard, GuestGuard, TokenKeepAlive
- [x] `features/chat/` - 채팅 기능 슬라이스 구현 완료
- [x] `features/chat/hook/useScenarioChatNew.ts` - 시나리오 WebSocket 훅
- [x] `features/chat/hook/useConversationChatNew.ts` - 대화 WebSocket 훅

#### 코드 품질
- [ ] ESLint 경고 모두 해결
- [ ] TypeScript strict mode 활성화 및 타입 오류 해결
- [ ] Prettier 포맷팅 전체 적용
- [ ] 미사용 import 및 변수 제거

### 현재 구현된 산출물
```
src/
├── shared/
│   ├── ui/
│   │   ├── index.ts              # 18개 UI 컴포넌트 re-export
│   │   ├── Button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── MicButton/
│   │   ├── ChatMicButton/
│   │   ├── GlassCard/
│   │   ├── GlassmorphicCard.tsx
│   │   ├── DecorativeCircle.tsx
│   │   ├── PageBackground.tsx
│   │   ├── Logo.tsx
│   │   ├── MalangEE.tsx
│   │   ├── PopupLayout.tsx
│   │   ├── FullLayout.tsx
│   │   ├── SplitViewLayout.tsx
│   │   ├── DebugStatus.tsx
│   │   └── ChatStatusBadge.tsx
│   ├── hooks/
│   │   ├── useAudioRecorder.ts   # ✅ PCM16 오디오 캡처
│   │   └── useInactivityTimer.ts
│   └── lib/
│       ├── api-client.ts         # ✅ Axios 인스턴스
│       ├── websocket-client.ts   # ✅ WebSocket 클라이언트
│       ├── jwt.ts                # JWT 유틸리티
│       ├── utils.ts              # cn 함수 등
│       ├── config.ts             # 환경 설정
│       ├── debug.ts              # 디버그 유틸리티
│       └── translate.ts          # 한국어 번역 유틸리티
├── entities/
│   └── __init__.ts               # 🔲 구현 필요
├── features/
│   ├── auth/                     # ✅ 완전 구현
│   │   ├── api/
│   │   ├── hook/
│   │   ├── model/
│   │   ├── ui/
│   │   └── index.ts
│   └── chat/                     # ✅ 완전 구현
│       ├── api/
│       ├── hook/
│       │   ├── useScenarioChatNew.ts
│       │   └── useConversationChatNew.ts
│       └── index.ts
└── widgets/
    └── __init__.ts               # 🔲 구현 필요
```

### 검증 방법
```bash
yarn lint        # ESLint 오류 0개
yarn tsc --noEmit # TypeScript 오류 0개
yarn build       # 빌드 성공
```

---

## Phase 2: UI/UX 개선 및 디자인 시스템 일관성

### 오버뷰
디자인 시스템의 일관성을 높이고, 사용자 경험을 개선하는 단계입니다. Tailwind CSS v4 테마 변수를 최대한 활용하고, 하드코딩된 색상값을 테마 변수로 교체합니다.

### 컨텍스트
- **현재 상태**: 대부분의 색상이 테마 변수로 마이그레이션 완료
- **목표 상태**: 반응형 디자인 및 접근성 개선
- **디자인 참고**: `/frontend/docs/tailwind.md`
- **Figma**: https://www.figma.com/design/Fl5FSDITnfaalJhepW2p1d/

### 수정/개선 체크리스트

#### 색상 시스템 통일
- [x] `app/globals.css` - 테마 색상 변수 추가 완료
- [x] `app/auth/login/page.tsx` - 색상값을 테마 변수로 마이그레이션
- [x] `app/auth/signup/page.tsx` - 색상값을 테마 변수로 마이그레이션
- [x] `app/topic-select/page.tsx` - 테마 변수 적용
- [x] `shared/ui/Button.tsx` - 버튼 variant 색상을 테마 변수로 업데이트

#### 공용 컴포넌트 추가
- [x] `shared/ui/DecorativeCircle.tsx` - 배경 장식 원형 컴포넌트
- [x] `shared/ui/GlassmorphicCard.tsx` - 글래스모피즘 카드 컴포넌트
- [x] `shared/ui/PageBackground.tsx` - 공용 페이지 배경 컴포넌트
- [x] `shared/ui/Logo.tsx` - MalangEE 로고 컴포넌트
- [x] `shared/ui/MalangEE.tsx` - 마스코트 이미지 컴포넌트
- [x] `shared/ui/index.ts` - Button import 경로 수정

#### 반응형 디자인 개선
- [ ] 모바일 퍼스트 접근 방식으로 모든 페이지 검토
- [ ] 태블릿 브레이크포인트 (md:) 최적화
- [ ] 데스크톱 브레이크포인트 (lg:, xl:) 최적화
- [ ] 터치 타겟 크기 확인 (최소 44x44px)

#### 접근성 개선
- [ ] 모든 이미지에 적절한 alt 텍스트 추가
- [ ] 폼 요소에 적절한 label 연결
- [ ] 색상 대비 비율 확인 (WCAG AA 기준)
- [ ] 키보드 네비게이션 지원 확인
- [ ] focus 상태 스타일 명확하게 표시

#### 애니메이션 및 트랜지션
- [ ] 페이지 전환 애니메이션 추가
- [ ] 버튼 호버/클릭 애니메이션 통일
- [ ] 로딩 스켈레톤 컴포넌트 추가
- [ ] 마이크 녹음 중 펄스 애니메이션 개선

### 검증 방법
```bash
yarn storybook   # 모든 컴포넌트 시각적 검토
yarn build       # 빌드 성공
# Lighthouse 접근성 점수 90+ 목표
```

---

## Phase 3: 음성 녹음 및 WebSocket 기능 ✅ 완료

### 오버뷰
플랫폼의 핵심 기능인 실시간 음성 대화가 구현 완료되었습니다.

### 구현 완료 내역

#### WebSocket 두 가지 타입 구현 (참고: `/docs/WEBSOCKET_GUIDE.md`)

**1. 시나리오 WebSocket (토픽 선택)**
- **엔드포인트**: `ws://[host]/api/v1/ws/scenario?token=...`
- **구현 파일**: `features/chat/hook/useScenarioChatNew.ts` (225줄)
- **기능**: 시나리오 생성을 위한 음성 대화
- **이벤트 처리**:
  - [x] `ready` - 연결 준비 완료
  - [x] `response.audio.delta` - TTS 오디오 스트리밍
  - [x] `response.audio_transcript.delta/done` - AI 응답 텍스트
  - [x] `input_audio.transcript` - 사용자 음성 텍스트 변환
  - [x] `scenario.completed` - 시나리오 생성 완료

**2. 대화 WebSocket (실제 대화)**
- **엔드포인트**: `ws://[host]/api/v1/chat/ws/chat/{session_id}?token=...`
- **구현 파일**: `features/chat/hook/useConversationChatNew.ts` (329줄)
- **기능**: 생성된 시나리오로 실제 영어 대화
- **이벤트 처리**:
  - [x] `session.update` - 세션 설정 업데이트
  - [x] `audio.delta` - TTS 오디오 스트리밍
  - [x] `transcript.done` - AI 응답 완료
  - [x] `user.transcript` - 사용자 발화 텍스트
  - [x] `speech.started/stopped` - VAD 감지 상태
  - [x] `disconnected` - 연결 해제

#### 오디오 기능 구현
- [x] `shared/hooks/useAudioRecorder.ts` - 마이크 캡처 훅
  - [x] PCM16 모노 오디오 캡처
  - [x] 24kHz 샘플레이트 지원
  - [x] 볼륨 감지 (RMS 계산)
  - [x] AudioWorklet/ScriptProcessor 폴백 지원
- [x] `shared/lib/websocket-client.ts` - WebSocket 클라이언트 클래스
  - [x] 연결 관리 (connect, disconnect, reconnect)
  - [x] 메시지 핸들러 등록
  - [x] 에러 처리 및 재연결 로직

### WebSocket 메시지 스펙

#### 시나리오 WebSocket (Client → Server)
```typescript
// 오디오 청크 전송
{ type: "input_audio_chunk", audio: "<base64 pcm16>", sample_rate: 24000 }
```

#### 시나리오 WebSocket (Server → Client)
```typescript
// 연결 준비 완료
{ type: "ready" }
// TTS 오디오 스트리밍
{ type: "response.audio.delta", delta: "<base64 pcm16>" }
// 시나리오 완료
{ type: "scenario.completed", json: { place, conversation_partner, conversation_goal } }
```

#### 대화 WebSocket (Client → Server)
```typescript
// 오디오 버퍼 추가
{ type: "input_audio_buffer.append", audio: "<base64 pcm16>" }
// 세션 설정
{ type: "session.update", session: { modalities: ["audio", "text"], ... } }
```

#### 대화 WebSocket (Server → Client)
```typescript
// TTS 오디오 스트리밍
{ type: "audio.delta", delta: "<base64 pcm16>" }
// AI 응답 텍스트 완료
{ type: "transcript.done", transcript: "..." }
// 사용자 발화 텍스트
{ type: "user.transcript", transcript: "..." }
```

### 구현된 산출물
```
src/
├── shared/
│   ├── hooks/
│   │   └── useAudioRecorder.ts   # ✅ PCM16 마이크 캡처
│   └── lib/
│       └── websocket-client.ts   # ✅ WebSocket 클라이언트
└── features/
    └── chat/
        ├── hook/
        │   ├── useScenarioChatNew.ts     # ✅ 시나리오 WebSocket 훅
        │   └── useConversationChatNew.ts # ✅ 대화 WebSocket 훅
        └── index.ts
```

### 검증 방법
```bash
yarn dev         # 개발 서버 실행
# 브라우저에서 마이크 권한 허용 후 테스트
# WebSocket 연결 확인 (개발자 도구 Network 탭)
# 오디오 입출력 테스트
```

---

## Phase 4: 대시보드 및 학습 기능 페이지 구현

### 오버뷰
사용자 대시보드와 다양한 학습 기능 페이지를 구현하는 단계입니다. Quick Response, Think Aloud, Rephrasing, Daily Reflection 등의 학습 모드를 구현합니다.

### 컨텍스트
- **현재 상태**: 대시보드에 링크만 존재, 실제 기능 페이지 미구현
- **목표 상태**: 각 학습 모드별 완전한 기능 페이지 구현
- **참고**: 대시보드에서 연결되는 6개 학습 모드

### 수정/개선 체크리스트

#### 대시보드 개선
- [ ] `app/dashboard/page.tsx` - 레이아웃 개선
- [ ] `widgets/dashboard/` - 대시보드 위젯 슬라이스 생성
- [ ] `widgets/dashboard/ui/LearningCard.tsx` - 학습 모드 카드 컴포넌트
- [ ] `widgets/dashboard/ui/ProgressSummary.tsx` - 진행 상황 요약 위젯
- [ ] `widgets/dashboard/ui/RecentActivity.tsx` - 최근 활동 위젯

#### Quick Response 기능
- [ ] `app/quick-response/page.tsx` - 퀵 리스폰스 페이지
- [ ] `features/quick-response/` - 퀵 리스폰스 슬라이스
- [ ] `features/quick-response/ui/QuickResponseForm.tsx` - 입력 폼
- [ ] `features/quick-response/hook/useQuickResponse.ts` - 상태 관리 훅

#### Think Aloud 기능
- [ ] `app/think-aloud/page.tsx` - Think Aloud 페이지
- [ ] `features/think-aloud/` - Think Aloud 슬라이스
- [ ] `features/think-aloud/ui/ThinkAloudForm.tsx` - 입력 폼
- [ ] `features/think-aloud/hook/useThinkAloud.ts` - 상태 관리 훅

#### Rephrasing 기능
- [ ] `app/rephrasing/page.tsx` - Rephrasing 페이지
- [ ] `features/rephrasing/` - Rephrasing 슬라이스
- [ ] `features/rephrasing/ui/RephrasingForm.tsx` - 입력 폼
- [ ] `features/rephrasing/hook/useRephrasing.ts` - 상태 관리 훅

#### Daily Reflection 기능
- [ ] `app/daily-reflection/page.tsx` - Daily Reflection 페이지
- [ ] `features/daily-reflection/` - Daily Reflection 슬라이스
- [ ] `features/daily-reflection/ui/ReflectionForm.tsx` - 반성 일지 폼
- [ ] `features/daily-reflection/ui/ReflectionList.tsx` - 반성 일지 목록

#### Progress 페이지
- [ ] `app/progress/page.tsx` - 학습 진행 상황 페이지
- [ ] `widgets/progress/ui/LearningChart.tsx` - 학습 통계 차트
- [ ] `widgets/progress/ui/AchievementBadges.tsx` - 달성 뱃지

### 예상 산출물
```
src/
├── app/
│   ├── dashboard/page.tsx
│   ├── quick-response/page.tsx
│   ├── think-aloud/page.tsx
│   ├── rephrasing/page.tsx
│   ├── daily-reflection/page.tsx
│   └── progress/page.tsx
├── features/
│   ├── quick-response/
│   ├── think-aloud/
│   ├── rephrasing/
│   └── daily-reflection/
└── widgets/
    ├── dashboard/
    └── progress/
```

### 검증 방법
```bash
yarn dev         # 모든 페이지 접근 테스트
yarn build       # 빌드 성공
# 각 학습 모드 수동 테스트
```

---

## Phase 5: 테스트 및 품질 보증

### 오버뷰
프로젝트의 안정성을 보장하기 위해 테스트 코드를 작성하고, 성능을 최적화하는 단계입니다.

### 컨텍스트
- **현재 상태**: 일부 단위 테스트 존재, E2E 테스트 없음
- **목표 상태**: 핵심 기능 테스트 커버리지 80% 이상
- **테스트 도구**: Vitest (단위), Playwright (E2E)

### 현재 테스트 상태
- [x] `src/shared/ui/Button.test.tsx` - 버튼 컴포넌트 테스트
- [x] `src/shared/ui/input.test.tsx` - 인풋 컴포넌트 테스트
- [ ] E2E 테스트 - 미구현

### 수정/개선 체크리스트

#### 단위 테스트 (Vitest)
- [x] `shared/ui/button.test.tsx` - 버튼 컴포넌트 테스트
- [x] `shared/ui/input.test.tsx` - 인풋 컴포넌트 테스트
- [ ] `shared/lib/utils.test.ts` - 유틸리티 함수 테스트
- [ ] `features/auth/hook/useLogin.test.ts` - 로그인 훅 테스트
- [ ] `features/auth/hook/useRegister.test.ts` - 회원가입 훅 테스트
- [ ] `shared/hooks/useAudioRecorder.test.ts` - 오디오 레코더 훅 테스트
- [ ] `features/chat/hook/useScenarioChatNew.test.ts` - 시나리오 WebSocket 훅 테스트
- [ ] `features/chat/hook/useConversationChatNew.test.ts` - 대화 WebSocket 훅 테스트

#### 컴포넌트 테스트
- [ ] `shared/ui/MicButton/MicButton.test.tsx` - 마이크 버튼 테스트
- [ ] `shared/ui/GlassCard/GlassCard.test.tsx` - 글래스 카드 테스트
- [ ] `features/auth/ui/LoginForm.test.tsx` - 로그인 폼 테스트
- [ ] `features/auth/ui/SignupForm.test.tsx` - 회원가입 폼 테스트

#### E2E 테스트 (Playwright)
- [ ] `e2e/auth.spec.ts` - 인증 플로우 테스트
  - [ ] 로그인 성공/실패 시나리오
  - [ ] 회원가입 성공/실패 시나리오
  - [ ] 게스트 접근 시나리오
- [ ] `e2e/navigation.spec.ts` - 네비게이션 테스트
- [ ] `e2e/scenario.spec.ts` - 시나리오 대화 테스트 (mock WebSocket)

#### 스토리북
- [ ] `shared/ui/button.stories.tsx` - 버튼 스토리
- [ ] `shared/ui/MicButton/MicButton.stories.tsx` - 마이크 버튼 스토리
- [ ] `shared/ui/GlassCard/GlassCard.stories.tsx` - 글래스 카드 스토리
- [ ] `features/auth/ui/LoginForm.stories.tsx` - 로그인 폼 스토리
- [ ] `features/auth/ui/SignupForm.stories.tsx` - 회원가입 폼 스토리

#### 성능 최적화
- [ ] React.memo를 사용한 불필요한 리렌더링 방지
- [ ] dynamic import를 통한 코드 스플리팅
- [ ] 이미지 최적화 (next/image 활용)
- [ ] 번들 사이즈 분석 및 최적화

#### 문서화
- [ ] README.md 업데이트
- [ ] API 문서 작성
- [ ] 컴포넌트 문서 (Storybook docs)

### 예상 산출물
```
frontend/
├── tests/                    # Vitest 단위 테스트
│   └── *.test.ts
├── e2e/                      # Playwright E2E 테스트
│   └── *.spec.ts
└── src/
    └── **/*.stories.tsx      # 스토리북 파일
```

### 검증 방법
```bash
yarn test              # 단위 테스트 통과
yarn test:coverage     # 커버리지 80% 이상
yarn test:e2e          # E2E 테스트 통과
yarn storybook         # 스토리북 정상 작동
yarn build             # 프로덕션 빌드 성공
```

---

## 실행 순서 및 의존성

```
Phase 1 (기초) - 70% 완료
    ↓
Phase 2 (UI/UX) - 60% 완료 ←── Phase 1 완료 필수
    ↓
Phase 3 (음성/WebSocket) ✅ 완료
    ↓
Phase 4 (대시보드/학습) ←── Phase 2, 3 완료 권장
    ↓
Phase 5 (테스트/품질) - 10% 완료 ←── Phase 1~4 완료 후 진행
```

### 병렬 작업 가능 영역
- Phase 1의 entities 구축과 Phase 2의 반응형/접근성 개선 병렬 진행 가능
- Phase 4의 각 학습 모드는 병렬 개발 가능
- Phase 5의 테스트 작성은 해당 기능 구현 직후 바로 시작 가능

---

## 버전 관리 전략

각 Phase 완료 시 태그 생성:
- `v0.1.0` - Phase 1 완료
- `v0.2.0` - Phase 2 완료
- `v0.3.0` - Phase 3 완료 ✅
- `v0.4.0` - Phase 4 완료
- `v1.0.0` - Phase 5 완료 (MVP)

---

## 참고 문서

- `/frontend/docs/api.md` - REST API 명세
- `/frontend/docs/ws.md` - WebSocket 엔드포인트
- `/frontend/docs/WEBSOCKET_GUIDE.md` - WebSocket 구현 상세 가이드
- `/frontend/docs/tailwind.md` - Tailwind CSS v4 디자인 시스템

---

**최초 작성일**: 2025-01-10
**마지막 업데이트**: 2025-01-20
**작성자**: Claude Code Agent
