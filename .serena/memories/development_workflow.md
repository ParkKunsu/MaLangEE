# 개발 워크플로우

## 로컬 개발 환경 시작

### 1. Node 버전 확인 및 설정
```bash
cd frontend
nvm use              # .nvmrc 파일 기반 (Node 20.x)
```

### 2. 의존성 설치
```bash
yarn install         # 처음 한 번만
```

### 3. 환경 변수 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필수 환경 변수
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### 4. 개발 서버 실행
```bash
yarn dev             # http://localhost:3000
```

## 새 기능 개발 프로세스

### 1. Feature 브랜치 생성
```bash
git checkout -b feature/feature-name
```

### 2. FSD 구조로 코드 작성
```
features/new-feature/
├── api/         # API 호출 로직
├── model/       # 타입 및 스키마
├── ui/          # UI 컴포넌트
├── hook/        # 커스텀 훅
└── index.ts     # Public API
```

### 3. 컴포넌트 + 스토리북 작성
```bash
# 스토리북 시작
yarn storybook

# 컴포넌트 개발 및 스토리 작성
```

### 4. 테스트 작성
```bash
# 단위 테스트 작성 및 실행
yarn test

# E2E 테스트 작성 (필요시)
yarn test:e2e
```

### 5. 코드 검증
```bash
yarn lint:fix        # 린트 자동 수정
yarn tsc --noEmit    # 타입 체크
yarn build           # 빌드 검증
```

### 6. 커밋 및 푸시
```bash
git add .
git commit -m "feat: feature description"
git push origin feature/feature-name
```

### 7. PR 생성
- GitHub에서 Pull Request 생성
- 테스트 결과 포함
- 리뷰 요청

## 코드 리뷰 후 배포
- PR 승인 후 main 브랜치에 머지
- 자동 배포 (Cron - 최대 10분 대기)
- 또는 수동 배포: `/home/aimaster/projects/MaLangEE/deploy.sh`

## 트러블슈팅
- **포트 충돌**: `lsof -i :3000` → `kill -9 <PID>`
- **모듈 에러**: `rm -rf node_modules && yarn install`
- **빌드 에러**: `.next` 폴더 삭제 후 재빌드
