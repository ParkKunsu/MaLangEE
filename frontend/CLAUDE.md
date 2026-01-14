# CLAUDE.md

프론트엔드 개발 가이드

## 프로젝트 개요

**말랭이 (MaLangEE)** - AI 기반 실시간 영어 회화 학습 플랫폼

- **기술 스택**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **상태관리**: TanStack React Query v5 + Zustand
- **폼/검증**: React Hook Form + Zod
- **테스팅**: Vitest + Playwright
- **패키지 매니저**: yarn

## 서버 정보

| 환경 | Frontend | Backend API | WebSocket |
|------|----------|-------------|-----------|
| 개발 | http://49.50.137.35:3000 | http://49.50.137.35:8080/api | ws://49.50.137.35:8080/api/v1/ws |
| 로컬 | http://localhost:3000 | http://localhost:8080 | ws://localhost:8080/api/v1/ws |

## 필수 명령어

```bash
yarn dev          # 개발 서버
yarn build        # 프로덕션 빌드
yarn lint         # ESLint 실행
yarn tsc --noEmit # 타입 체크
yarn test         # 단위 테스트
yarn test:e2e     # E2E 테스트
```

## 프로젝트 구조 (FSD)

```
src/
├── app/        # Next.js App Router 페이지
├── widgets/    # 복합 UI 컴포넌트
├── features/   # 독립적 기능 모듈 (auth, chat)
├── entities/   # 비즈니스 엔티티
└── shared/     # 공용 유틸리티 (api, lib, ui, types)
```

**의존성 규칙**: `app → widgets → features → entities → shared`

## 코드 컨벤션

- **경로 별칭**: `@/*` → `./src/*`
- **컴포넌트**: `import { FC } from 'react'`
- **타입**: Zod 스키마 우선, 타입 추론 활용
- **인증**: `Authorization: Bearer {access_token}`

## 참고 문서

- `docs/api.md` - REST API 명세
- `docs/ws.md` - WebSocket 명세
- `docs/tailwind.md` - 디자인 시스템
- `../docs/01-DEV_GUIDE.md` - 로컬 개발 가이드
