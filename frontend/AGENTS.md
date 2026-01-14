# Repository Guidelines

## 프로젝트 구조 & 라우트
- `src/app`: Next.js App Router. 라우트: [`/`](/), [`/auth/login`](/auth/login), [`/auth/signup`](/auth/signup), [`/auth/scenario-select`](/auth/scenario-select), [`/topic-select`](/topic-select), [`/chat/conversation`](/chat/conversation), [`/chat/complete`](/chat/complete), [`/chat/subtitle-settings`](/chat/subtitle-settings), [`/chat/voice-selection`](/chat/voice-selection), [`/chat/welcome-back`](/chat/welcome-back), [`/chat-history`](/chat-history), [`/logout`](/logout).
- `src/features`: `auth`, `chat` 모듈만 존재. 그 외 도메인은 아직 없음.
- `src/shared`: `ui`, `lib`, `types`, `api`, `styles` 공통 레이어.
- `src/entities`, `src/widgets`: 현재 `__init__.ts`만 있는 placeholder 상태.
- `public/images`, `public/favicon.ico`: 정적 리소스.
- `scripts`: 운영 보조 쉘 스크립트와 `generate-favicon.js`.
- `e2e`: Playwright E2E 테스트. `docs`: 설계/운영/스타일 문서.

## 핵심 페이지 흐름 (실제 구현 기준)
- 게스트 체험: [`/auth/scenario-select`](/auth/scenario-select) -> (로그인 유도 팝업) -> [`/auth/login`](/auth/login) 또는 [`/auth/signup`](/auth/signup).
- 로그인: [`/auth/login`](/auth/login) -> 성공 시 [`/chat-history`](/chat-history).
- 회원가입: [`/auth/signup`](/auth/signup) -> 성공 팝업에서 즉시 로그인 시도 -> 성공 시 [`/chat-history`](/chat-history).
- 대화 재개: [`/chat-history`](/chat-history) -> 버튼으로 [`/chat/welcome-back`](/chat/welcome-back).
- 로그아웃: [`/logout`](/logout) 진입 시 토큰/캐시 삭제 후 [`/auth/login`](/auth/login)으로 이동.

## 권한/인증
- 토큰 저장: `localStorage`의 `access_token` 사용(`tokenStorage`).
- 인증 유지: `useCurrentUser`는 토큰이 있을 때만 실행, 401/403이면 토큰 삭제.
- 보호 라우트: [`/topic-select`](/topic-select)은 `AuthGuard`로 감싼 유일한 보호 페이지.
- 게스트 가드: `GuestGuard`는 구현되어 있으나 현재 라우트에서 사용되지 않음.

## 데이터 소스 & API
- API 기본 URL: `config.apiUrl` (dev는 `/api/v1` 프록시, prod는 `NEXT_PUBLIC_API_URL + /api/v1`).
- 공통 클라이언트: `apiClient`가 `Authorization: Bearer <token>` 자동 첨부.
- 로그인만 예외: `authApi.login`은 `application/x-www-form-urlencoded`로 직접 `fetch`.
- 채팅 이력: `useGetChatSessions`가 `/chat/sessions` 호출. `NODE_ENV=development`면 UI는 목 데이터로 대체.
- 채팅 상세/대본 팝업: 현재는 샘플 데이터로 렌더링(실 API 미연동).

## 환경 변수
- 사용 중: `NEXT_PUBLIC_LOCALHOST_URL`, `NEXT_PUBLIC_API_URL` (`src/shared/lib/config.ts`).
- 템플릿에만 존재: `FIGMA_API_KEY`, `OPEN_AI_API` (현재 프론트 코드에서 참조 없음).
- `.env.example`을 `.env.local`로 복사해 사용하며 커밋 금지.

## 스크립트/운영
- `scripts/restart-dev.sh`: 포트 정리 후 dev 서버 재시작.
- `scripts/start-frontend.sh`: systemd user 기반 dev 서버 시작.
- `scripts/manage-frontend.sh`: start/stop/restart/status 통합.
- `scripts/generate-favicon.js`: 파비콘 생성.
- 상세: [scripts/README.md](scripts/README.md).

## 테스트
- 단위 테스트: `src/**`의 `*.test.ts(x)` (현재 `features/auth` 중심).
- E2E: `e2e/*.spec.ts` (Playwright).
- 명령어: `yarn test`, `yarn test:coverage`, `yarn test:e2e`.

## 디버깅 팁
- 인증 문제: 콘솔 로그(`useAuth`, `useCurrentUser`, `AuthGuard`) 확인 후 토큰 유무 체크.
- API 401/403: `apiClient`가 에러를 던지고 토큰 삭제 트리거됨.
- 개발 모드 이력 페이지: `NODE_ENV=development`면 `chat-history`에서 목 데이터 사용.
- 네트워크 오류: 회원가입 중복체크는 네트워크 오류 메시지를 별도 처리.

## 코딩 스타일 & 네이밍
- 아이콘은 `lucide-react` 사용.
- TypeScript strict 모드, 2칸 들여쓰기, 탭 금지, print width 100.
- Prettier + ESLint(`next/core-web-vitals`) 준수.
- 절대 경로는 `@/` 사용.

## 문서 참고 (docs)
- [docs/api.md](docs/api.md): 백엔드 REST API와 인증 흐름, Base URL.
- [docs/ws.md](docs/ws.md): WebSocket 엔드포인트(`/api/v1/chat/ws/chat`, `/api/v1/chat/ws/guest-chat`).
- [docs/tailwind.md](docs/tailwind.md): Tailwind v4 토큰/색상/그라데이션.
- [docs/design_summer_v20250111.md](docs/design_summer_v20250111.md): 디자인 브랜치 변경 내역.
- [docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md): 개선 로드맵(대시보드/음성 기능 등은 현재 코드에 없음).
- [docs/BusinessReport.md](docs/BusinessReport.md): 기획/UX 분석 문서.
