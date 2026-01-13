# 자주 사용하는 명령어

## 개발 서버 실행
```bash
# Frontend 개발 서버 (포트 3000)
cd frontend
yarn dev

# 개발 서버 (파일 감시 모드)
yarn dev:watch
```

## 빌드 및 프로덕션
```bash
cd frontend
yarn build          # 프로덕션 빌드
yarn start          # 프로덕션 서버 시작
```

## 코드 품질
```bash
cd frontend
yarn lint           # ESLint 실행
yarn lint:fix       # ESLint 자동 수정
yarn format         # Prettier 포맷팅
yarn tsc --noEmit   # 타입 체크 (에러만 표시)
```

## 테스팅
```bash
cd frontend
yarn test              # Vitest 단위 테스트
yarn test:ui           # Vitest UI 모드
yarn test:coverage     # 커버리지 리포트
yarn test:e2e          # Playwright E2E 테스트
yarn test:e2e:ui       # Playwright UI 모드
```

## 스토리북
```bash
cd frontend
yarn storybook         # 스토리북 시작 (포트 6006)
yarn build-storybook   # 스토리북 빌드
```

## 배포 관련 (서버)
```bash
# 배포 로그 실시간 확인
tail -f /var/log/MaLangEE_deploy.log

# 저장소 상태 확인
cd /home/aimaster/projects/MaLangEE && git status

# 수동 배포 실행
/home/aimaster/projects/MaLangEE/deploy.sh
```

## macOS 시스템 명령어
```bash
# 파일 검색
find . -name "*.tsx"

# 패턴 검색
grep -r "pattern" src/

# 디렉토리 목록
ls -la
```
