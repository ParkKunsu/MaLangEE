# 말랭이 (MaLangEE) Frontend

AI 기반 실시간 영어 회화 학습 플랫폼의 프론트엔드 애플리케이션입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 4 + shadcn/ui (New York) |
| 상태관리 | TanStack React Query v5 |
| 폼 검증 | React Hook Form + Zod |
| 테스팅 | Vitest (단위), Playwright (E2E) |
| 아이콘 | Lucide React |
| 차트 | Recharts |
| i18n | next-intl |

## 시작하기

### 요구사항

- Node.js 20+
- Yarn 1.22+

### 설치

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn dev
```

개발 서버가 http://localhost:3000 에서 실행됩니다.

## 명령어

```bash
# 개발
yarn dev              # 개발 서버 (localhost:3000)
yarn build            # 프로덕션 빌드
yarn start            # 프로덕션 서버

# 코드 품질
yarn lint             # ESLint 실행
yarn lint:fix         # ESLint 자동 수정
yarn format           # Prettier 포맷팅

# 테스팅
yarn test             # Vitest 단위 테스트
yarn test:ui          # Vitest UI 모드
yarn test:coverage    # 커버리지 리포트
yarn test:e2e         # Playwright E2E 테스트
yarn test:e2e:ui      # Playwright UI 모드

# 스토리북
yarn storybook        # 스토리북 (localhost:6006)
yarn build-storybook  # 스토리북 빌드
```

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
│   ├── layout.tsx    # 루트 레이아웃
│   ├── page.tsx      # 홈 페이지
│   └── globals.css   # 글로벌 스타일 + Tailwind 설정
├── features/         # 기능별 모듈 (FSD)
│   ├── auth/         # 인증 (로그인/회원가입)
│   ├── rephrasing/   # 표현 바꿔말하기 학습
│   ├── scenario/     # 시나리오 기반 대화
│   ├── think-aloud/  # 생각 말하기 연습
│   ├── quick-response/ # 빠른 응답 훈련
│   └── daily-reflection/ # 일일 회고
├── shared/           # 공유 모듈
│   ├── ui/           # 공용 UI 컴포넌트
│   ├── lib/          # 유틸리티 함수
│   └── types/        # 공용 타입 정의
├── entities/         # 비즈니스 엔티티 (예정)
└── widgets/          # 복합 UI 컴포넌트 (예정)
```

### FSD (Feature-Sliced Design) 레이어 규칙

- `shared` → 외부 라이브러리만 의존
- `entities` → `shared` 의존
- `features` → `shared`, `entities` 의존
- `widgets` → `shared`, `entities`, `features` 의존
- `app` → 모든 레이어 의존

## 코드 컨벤션

### 경로 별칭

```typescript
import { Button } from "@/shared/ui";
import { useAuth } from "@/features/auth";
```

### 컴포넌트 작성

```typescript
import { FC } from "react";

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

### 타입 정의

- Zod 스키마 우선, 타입 추론 활용
- 명시적 타입은 `interface` 사용

## 스타일링

### Tailwind CSS v4

- CSS 변수 기반 테마 시스템
- 이너써클 디자인 시스템 색상 적용
- 다크모드 지원

자세한 내용은 [Tailwind 가이드](./docs/tailwind.md) 참조.

### shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add button
npx shadcn@latest add input
```

## 환경 변수

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 문서

- [프로젝트 정보](./docs/00-PROJECT_INFO.md)
- [개발 가이드](./docs/01-DEV_GUIDE.md)
- [서버 운영](./docs/02-SERVER_OPS.md)
- [Tailwind 가이드](./docs/tailwind.md)
