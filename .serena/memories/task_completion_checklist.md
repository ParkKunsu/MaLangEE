# 작업 완료 시 체크리스트

## 코드 작성 후 필수 단계

### 1. 코드 품질 검증
```bash
cd frontend
yarn lint           # ESLint 검사
yarn lint:fix       # 자동 수정 가능한 항목 수정
yarn tsc --noEmit   # TypeScript 타입 체크
```

### 2. 포맷팅 적용
```bash
yarn format         # Prettier 자동 포맷팅
```

### 3. 테스트 실행
```bash
yarn test           # 단위 테스트
yarn test:coverage  # 커버리지 확인 (80% 이상 목표)
```

### 4. E2E 테스트 (주요 기능 변경 시)
```bash
yarn test:e2e       # Playwright 테스트
```

### 5. 빌드 검증
```bash
yarn build          # 프로덕션 빌드 성공 확인
```

## FSD 구조 검증 (선택)
```bash
yarn steiger        # FSD 구조 검증 (있을 경우)
```

## Git 커밋 전 체크리스트
- [ ] 린트 에러 없음
- [ ] 타입 에러 없음
- [ ] 테스트 통과
- [ ] 빌드 성공
- [ ] 불필요한 console.log 제거
- [ ] TODO 주석 정리
- [ ] 변경 사항 문서화 (필요시)

## 주의사항
- 항상 feature 브랜치에서 작업
- main/master 브랜치에 직접 푸시 금지
- 의미있는 커밋 메시지 작성
- PR 생성 시 테스트 결과 포함
