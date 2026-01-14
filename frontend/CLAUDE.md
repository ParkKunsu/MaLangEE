# CLAUDE.md

프론트엔드 개발을 위한 핵심 가이드입니다.

## 프로젝트 개요

**말랭이 (MaLangEE)** - AI 기반 실시간 영어 회화 학습 플랫폼

- **핵심 가치**: 초저지연(0.5초 이내) 실시간 음성 대화 및 피드백
- **기술 스택**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **상태관리**: TanStack React Query v5 + Zustand
- **폼**: React Hook Form + Zod
- **테스팅**: Vitest + Playwright
- **패키지 매니저**: yarn
- **런타임**: Node.js 20+ (`.nvmrc` 참조)

## 서버 정보

| 환경 | Frontend | Backend API | WebSocket |
|------|----------|-------------|-----------|
| 개발 | http://49.50.137.35:3000 | http://49.50.137.35:8080/api | ws://49.50.137.35:8080/api/v1/ws |
| 로컬 | http://localhost:3000 | http://localhost:8080 | ws://localhost:8080/api/v1/ws |

```bash
# .env.local 설정
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## 필수 명령어

```bash
cd frontend

yarn dev              # 개발 서버 (localhost:3000)
yarn build            # 프로덕션 빌드
yarn lint             # ESLint 실행
yarn lint:fix         # ESLint 자동 수정
yarn tsc --noEmit     # 타입 체크
yarn test             # Vitest 단위 테스트
yarn test:e2e         # Playwright E2E 테스트
yarn storybook        # 스토리북 (localhost:6006)
```

## 프로젝트 구조 (FSD)

```
src/
├── app/        # Next.js App Router 페이지
├── widgets/    # 복합 UI 컴포넌트
├── features/   # 독립적 기능 모듈
│   ├── auth/          # 인증 (로그인, 회원가입)
│   └── chat/          # WebSocket 대화
├── entities/   # 비즈니스 엔티티
└── shared/     # 공용 유틸리티
    ├── api/    # API 클라이언트 (React Query)
    ├── lib/    # 유틸리티 함수
    ├── ui/     # shadcn/ui 컴포넌트
    └── types/  # 공용 타입
```

**의존성 규칙**: `app → widgets → features → entities → shared`

## API 연동

### REST API

| 엔드포인트 | 메서드 | 설명 | 인증 |
|-----------|--------|------|------|
| `/api/v1/auth/signup` | POST | 회원가입 | - |
| `/api/v1/auth/login` | POST | 로그인 (JWT 발급) | - |
| `/api/v1/users/me` | GET | 현재 사용자 정보 | O |
| `/api/v1/chat/sessions` | GET | 대화 세션 목록 | O |
| `/api/v1/chat/hints/{session_id}` | GET | 대화 힌트 생성 | O |

**인증 헤더**: `Authorization: Bearer {access_token}`

### WebSocket API

- **로그인**: `ws://.../api/v1/ws/scenario?token={access_token}`
- **게스트**: `ws://.../api/v1/ws/guest-scenario`

자세한 메시지 스펙은 `docs/ws.md` 참조

## 코드 컨벤션

- **경로 별칭**: `@/*` → `./src/*`
- **컴포넌트**: `import { FC } from 'react'` (React.FC 대신)
- **타입**: Zod 스키마 우선, 타입 추론 활용
- **스타일링**: Tailwind CSS 4 + shadcn/ui

### FSD 슬라이스 구조

```
features/{feature-name}/
├── api/         # React Query 훅
├── model/       # Zod 스키마 + 타입
├── ui/          # 컴포넌트 + 테스트
├── hook/        # 커스텀 훅
└── index.ts     # Public API
```

## 참고 문서

### 프로젝트 문서 (`../docs/`)
- `00-PROJECT_INFO.md` - 프로젝트 정보
- `01-DEV_GUIDE.md` - 로컬 개발 가이드
- `02-SERVER_OPS.md` - 서버 운영
- `03-FRONTEND_SCENARIO_GUIDE.md` - 프론트엔드 시나리오

### 프론트엔드 문서 (`docs/`)
- `api.md` - API 명세
- `ws.md` - WebSocket 명세 (PCM16 오디오 변환 포함)
- `tailwind.md` - 디자인 시스템
- `figma-page-design-url.md` - Figma 디자인 URL
- `design_summer_v20250111.md` - 디자인 명세
- `BusinessReport.md` - 비즈니스 분석
- `IMPROVEMENT_PLAN.md` - 개선 계획
