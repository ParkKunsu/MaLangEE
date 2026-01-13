# 프로젝트 구조 (FSD 아키텍처)

## 루트 구조
```
MaLangEE/
├── frontend/           # Next.js 프론트엔드 (주요 개발 영역)
├── backend/            # FastAPI 백엔드
├── ai-engine/          # AI 엔진 (Python)
├── docs/               # 프로젝트 문서
├── scripts/            # 배포/설정 스크립트
└── deploy.sh           # 메인 배포 스크립트
```

## Frontend 구조 (FSD)
```
frontend/src/
├── app/               # Next.js App Router 페이지
├── widgets/           # 복합 UI 컴포넌트
├── features/          # 독립적 기능 모듈
│   ├── auth/                 # 인증 (로그인, 회원가입)
│   ├── voice-recording/      # 마이크 캡처, PCM16 변환
│   └── scenario-chat/        # WebSocket 대화
├── entities/          # 비즈니스 엔티티
└── shared/            # 공용 유틸리티
    ├── api/                  # API 클라이언트 (React Query)
    ├── lib/                  # 유틸리티 함수
    ├── ui/                   # shadcn/ui 컴포넌트
    └── types/                # 공용 타입
```

## FSD 레이어 의존성 규칙
```
app → widgets → features → entities → shared
```
- 상위 레이어만 하위 레이어를 import 가능
- 동일 레이어 간 import 금지

## FSD 슬라이스 구조
```
features/auth/
├── api/         # React Query 훅
├── model/       # Zod 스키마 + 타입
├── ui/          # 컴포넌트 + 스토리북 + 테스트
├── hook/        # 커스텀 훅
└── index.ts     # Public API
```

## 주요 설정 파일
- `package.json` - 의존성 및 스크립트
- `tsconfig.json` - TypeScript 설정
- `next.config.ts` - Next.js 설정
- `tailwind.config.ts` - Tailwind CSS 설정
- `.env.local` - 환경 변수 (로컬)
- `.nvmrc` - Node 버전 (20.x)
