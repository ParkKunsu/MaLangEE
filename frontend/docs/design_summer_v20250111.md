# feature/design 브랜치 작업 내역

## 📋 개요

이 문서는 `feature/design` 브랜치에서 진행된 UI/UX 개선 및 기능 추가 작업을 정리한 문서입니다.

**작업 기간**: 2026-01-11
**브랜치**: `feature/design`
**기준 브랜치**: `main`

## 📊 변경 통계

### 초기 작업 (문서 작성 시점)
```
47개 파일 변경
1,866줄 추가
679줄 삭제
```

### 문서 작성 이후 추가 작업
```
- Button 컴포넌트 추가 및 전역 적용
- 대화 완료 페이지 추가
- 비활동 감지 로직 추가
- 에러 처리 개선
- 배포 스크립트 개선
- 개발 환경 도구 추가 (nodemon)
- 테스트 라이브러리 업데이트
```

## 🎯 주요 작업 내용

### 1. 공통 레이아웃 컴포넌트 추가

#### 1.1 PopupLayout 컴포넌트 (`src/shared/ui/PopupLayout.tsx`)
- 팝업 UI를 위한 공통 레이아웃 컴포넌트 생성
- **주요 기능**:
  - 배경 오버레이 (검은색 반투명 + 블러 효과)
  - 중앙 정렬된 카드 컨테이너
  - 상단 우측 닫기 버튼 (X 아이콘)
  - 커스터마이징 가능한 maxWidth (sm, md, lg, xl, 2xl, 3xl, 4xl)
  - 선택적 제목 또는 커스텀 헤더 컨텐츠 지원

#### 1.2 SplitViewLayout 컴포넌트 (`src/shared/ui/SplitViewLayout.tsx`)
- 좌우 분할 레이아웃을 위한 공통 컴포넌트
- **주요 기능**:
  - 좌측: 로고 및 부가 정보 영역
  - 우측: GlassCard를 사용한 메인 컨텐츠 영역
  - 비율 조정 가능 (leftColSpan, rightColSpan)
  - 배경 클래스 지정 가능

#### 1.3 FullLayout 컴포넌트 (`src/shared/ui/FullLayout.tsx`)
- 전체 화면 레이아웃을 위한 공통 컴포넌트
- **주요 기능**:
  - GlassCard를 중앙에 배치
  - 선택적 헤더 표시
  - 최대 너비 커스터마이징
  - 배경 클래스 지정 가능

### 2. 채팅 기록 기능 구현

#### 2.1 채팅 기록 페이지 (`src/app/chat-history/page.tsx`)
- **기능**:
  - 사용자 프로필 표시 (닉네임, 통계)
  - 대화 내역 목록 (무한 스크롤)
  - 닉네임 변경 버튼
  - 새로운 대화 시작 버튼
  - 대화 상세 보기 팝업 연동
  - 닉네임 변경 팝업 연동
- **레이아웃**: SplitViewLayout 사용 (4:8 비율)
- **데이터**: 디버그 모드에서 테스트 데이터 사용, 프로덕션에서 API 연동

#### 2.2 대화 상세 팝업 (`src/app/chat-history/ChatDetailPopup.tsx`)
- **기능**:
  - 대화 제목, 날짜, 시간 표시
  - 대화 요약 표시
  - 피드백 목록 표시 (사용자 답변 vs 더 나은 답변)
  - 전문보기 버튼 → ChatTranscriptPopup 연동
- **레이아웃**: PopupLayout 사용 (max-width: 2xl)

#### 2.3 전문 스크립트 팝업 (`src/app/chat-history/ChatTranscriptPopup.tsx`)
- **기능**:
  - 대화 전문을 테이블 형식으로 표시
  - 타임스탬프, 화자, 내용 표시
  - 스크롤 가능한 대화 목록
- **레이아웃**: PopupLayout 사용 (max-width: 2xl)

#### 2.4 닉네임 변경 팝업 (`src/app/chat-history/NicknameChangePopup.tsx`)
- **기능**:
  - 기존 닉네임 표시 (읽기 전용)
  - 새로운 닉네임 입력 및 실시간 중복 확인
  - 폼 검증 (React Hook Form + Zod)
  - 변경 완료 시 콜백 실행
- **레이아웃**: PopupLayout 사용 (max-width: md)
- **개선사항**: 독립 페이지에서 팝업으로 변경하여 UX 개선

#### 2.5 지난 대화 이어하기 페이지 (`src/app/chat/welcome-back/page.tsx`)
- **기능**:
  - 지난 대화 세션을 이어서 시작하는 페이지
  - 환영 메시지 및 이전 대화 정보 표시
  - 대화 시작 버튼

### 3. Chat API 연동

#### 3.1 Chat Sessions API (`src/features/chat/api/use-chat-sessions.ts`)
- React Query를 사용한 채팅 세션 데이터 fetching
- 페이지네이션 지원 (skip, limit)
- **API 엔드포인트**: `/chat/sessions`

#### 3.2 Chat 타입 정의 (`src/shared/types/chat.ts`)
```typescript
interface ChatSession {
  session_id: string;
  started_at: string;
  title: string;
  total_duration_sec: number;
  user_speech_duration_sec: number;
}

interface ChatHistoryItem {
  id: string;
  date: string;
  title: string;
  duration: string;
  totalDurationSec: number;
  userSpeechDurationSec: number;
}
```

### 4. 인증 시스템 개선

#### 4.1 인증 API 개선
- **닉네임 변경 API** 추가 (`/auth/update-nickname`)
- **닉네임 중복 확인 API** 추가 (`/auth/check-nickname`)
- 토큰 재발급 로직 개선

#### 4.2 useCurrentUser 훅 개선 (`src/features/auth/api/use-current-user.ts`)
- 사용자 정보 캐싱
- 자동 재시도 로직
- 오류 처리 개선
- 로딩 상태 관리

#### 4.3 AuthGuard 개선 (`src/features/auth/ui/AuthGuard.tsx`)
- 로딩 중 화면 추가
- 인증 실패 시 로그인 페이지로 리다이렉트
- 더 명확한 로딩/에러 상태 처리

#### 4.4 GuestGuard 개선 (`src/features/auth/ui/GuestGuard.tsx`)
- 로그인된 사용자의 접근 제한
- 로딩 중 화면 추가
- 인증된 사용자는 자동으로 시나리오 선택 페이지로 이동

#### 4.5 Logout 페이지 추가 (`src/app/logout/page.tsx`)
- 독립적인 로그아웃 처리 페이지
- 로그아웃 후 로그인 페이지로 자동 이동

### 5. UI/UX 개선

#### 5.1 말랭이 캐릭터 이미지 추가
- **파일**:
  - `malangee.gif`: 애니메이션 이미지
- **용도**: 로고, 대기 화면, 로딩 인디케이터
- 기존 `mascot.svg` 제거

#### 5.2 GlassCard 컴포넌트 개선
- 최소 높이 조정 (750px → 550px)
- 헤더 표시/숨김 옵션 추가 (`showHeader` prop)
- 기본 헤더에 대화 기록, 로그아웃 버튼 추가
- 스타일 개선 및 애니메이션 추가

#### 5.3 공통 스크롤바 스타일
- `globals.css`에 `.custom-scrollbar` 클래스 추가
- 일관된 스크롤바 디자인 적용
- 보라색 계열 (`#7B6CF6`)의 썸 색상

#### 5.4 로그인/회원가입 페이지 개선
- FullLayout 적용
- 불필요한 요소 제거
- 일관된 디자인 적용
- 반응형 레이아웃 개선

#### 5.5 시나리오 선택 페이지 개선
- 음성 인식 상태 UI 추가
- AuthGuard 통합
- 레이아웃 개선

### 6. 코드 구조 개선

#### 6.1 페이지 구조 정리
- **삭제**: `src/app/dashboard/page.tsx` (사용하지 않음)
- **삭제**: `src/app/change-nickname/` (팝업으로 대체)
- **추가**: `src/app/chat-history/` (대화 기록 페이지)
- **추가**: `src/app/logout/` (로그아웃 페이지)

#### 6.2 네비게이션 개선
- 대시보드 링크 → 채팅 기록 링크로 변경
- 로그아웃 버튼 위치 조정

#### 6.3 설정 파일 개선
- **API 설정** (`src/shared/lib/config.ts`):
  - 환경변수 기반 API URL 설정
  - 디버그 모드 지원
- **Next.js 설정** (`next.config.ts`):
  - 이미지 최적화 설정
  - 외부 이미지 도메인 허용

### 7. 팝업 상태에 따른 헤더 제어

#### 7.1 SplitViewLayout 헤더 제어
- `showHeader` prop 추가
- 팝업 열림 시 배경 헤더 자동 숨김
- 사용자 경험 개선

#### 7.2 조건부 헤더 표시 로직
```tsx
<SplitViewLayout
  showHeader={!showNicknamePopup && !showDetailPopup}
  // ...
/>
```

## 🔧 기술 스택 변경사항

### 추가된 의존성
- (기존 의존성 유지)

### 개선된 패턴
- **레이아웃 패턴**: 공통 레이아웃 컴포넌트 사용
- **팝업 패턴**: PopupLayout으로 통일
- **폼 검증**: React Hook Form + Zod
- **API 통신**: React Query + Axios
- **타입 안정성**: TypeScript strict mode

## 📝 주요 커밋 히스토리

### 문서 작성 이후 (2026-01-11 ~ 2026-01-12)
```
fdbc8b5 feat: add nodemon for development and enhance error handling in duplicate checks
d2f88e9 feat: add Button component with customizable variants and sizes
87458b4 refactor: enhance deploy script with timeout handling for npm install and build processes
d52420d fix: @testing-library/react 및 관련 패키지 버전 업데이트
facc9b4 fix: Button 컴포넌트의 대문자 파일명으로 수정
4d40d50 feat: add comprehensive Copilot instructions for MaLangEE architecture and workflows
bfaf2f7 feat: enhance deploy script to include Next.js and FastAPI server startup with health checks
fbfe0e2 fix: update import paths for Button component to match file naming convention
49eb92c fix: @testing-library/react 버전 업데이트
2ccd163 feat: 대화 중 비활동 및 팝업 로직 추가
95162a4 feat: Button 컴포넌트 추가 및 기존 버튼 교체
d4aaa8f feat: 대화 완료 페이지 및 관련 로직 추가
7ead329 refactor: PopupLayout 닫기 버튼 위치 및 헤더 구조 개선
7e57b5b feat: 자막 토글 및 대화 상태 테스트 버튼 추가
cb9df3e feat: 비활동 및 대화 상태 관리 로직 추가
9dc2219 feat: 로그인 팝업 추가 및 마이크 버튼 기능 수정
d006a2e feat: 말랭이 대화 설정 페이지 추가
0b551cb feat: 페이지 레이아웃 및 텍스트 그룹 스타일 수정
```

### 문서 작성 시점까지 (2026-01-11)
```
6ccbee0 feat: feature/design 브런치의 전반적인 작업사항 설명문서 추가
9d10de4 feat: PopupLayout 컴포넌트 추가 및 팝업 UI 공통화
c407bf7 feat: 닉네임 변경 페이지 및 관련 UI 제거
45f5e84 feat: 인증 오류 처리 개선 및 로딩 상태 로직 업데이트
3fde154 refactor: FullLayout 최대 너비 수정
3a46eed feat: 지난 대화 이어하기 페이지 추가
d36802a feat: 채팅 상세 및 전문 보기 팝업 추가
e783750 refactor: scenario-logo 스타일 수정
4566139 feat: temp.html 제거 및 GlassCard 컴포넌트 개선
3f604e0 feat: SplitViewLayout 컴포넌트 추가 및 레이아웃 수정
f68d07b feat: Dashboard 페이지 삭제 및 채팅 기록 페이지 추가
895ae6b feat: favicon 생성 시 mascot.svg를 malangee.gif로 변경
e984d6f feat: 페이지 레이아웃 수정 및 malangee.gif 이미지로 변경
922b99d feat: GlassCard 컴포넌트의 최소 높이를 750px에서 550px로 변경
5ae7ca1 feat: malangee.gif 파일 추가 및 애니메이션 효과 구현
c45fa9c feat: GlassCard, MicButton, FullLayout, CardLayout 컴포넌트 내보내기 추가
d2f46a4 feat: FullLayout 컴포넌트 추가 및 레이아웃 구성
f31b36c feat: GlassCard 컴포넌트의 크기 조정 및 최소 높이 변경
47d9e22 feat: 공통 스크롤바 스타일 추가
2362764 feat: 네비게이션 항목에서 대시보드 링크를 채팅 기록으로 변경
f827943 feat: 대화 세션 관련 타입 정의 추가
73360d0 feat: 로그인 페이지 레이아웃 개선 및 불필요한 요소 제거
2e12022 feat: enhance ScenarioSelectPage with voice recognition states
```

## 🎨 디자인 시스템 개선

### 색상 팔레트
- 주요 색상: `#7B6CF6`, `#5F51D9` (보라색 계열)
- 보조 색상: `#D4CCFF` (연한 보라색)
- 텍스트: `#1F1C2B` (진한 회색), `#6A667A` (중간 회색)

### 타이포그래피
- 제목: `text-2xl font-bold`
- 본문: `text-sm`, `text-base`
- Letter spacing: `-0.2px` (한글 최적화)

### 레이아웃
- 둥근 모서리: `rounded-full` (버튼), `rounded-[32px]` (카드)
- 그림자: `shadow-[0_20px_80px_rgba(123,108,246,0.3)]`
- 백드롭 블러: `backdrop-blur-sm`, `backdrop-blur-2xl`

## 🚀 다음 단계

### 필요한 작업
1. **백엔드 API 연동 완료**
   - 채팅 세션 API 구현
   - 피드백 데이터 API 구현
   - 대화 전문 API 구현

2. **테스트 작성**
   - 단위 테스트 (Vitest)
   - E2E 테스트 (Playwright)

3. **성능 최적화**
   - 이미지 최적화
   - 코드 스플리팅
   - 레이지 로딩

4. **접근성 개선**
   - ARIA 레이블 추가
   - 키보드 네비게이션
   - 스크린 리더 지원

## 📦 배포 준비

### 빌드 확인
```bash
cd frontend
yarn build
```

### 린트 및 타입 체크
```bash
yarn lint
yarn tsc --noEmit
```

### 환경 변수 설정
```env
NEXT_PUBLIC_API_URL=https://api.malangee.com
NEXT_PUBLIC_DEBUG_MODE=false
```

## 📄 관련 문서

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 가이드
- [README.md](../README.md) - 프로젝트 개요
- [FSD 아키텍처 가이드](../docs/fsd-architecture.md)

## 📅 Phase 2 작업 내역 (2026-01-12)

### Phase 2: UI/UX 개선 및 디자인 시스템 일관성 확립

#### 완료 일자: 2026-01-12
#### 커밋: b2a6d44 "feat: Phase 2 - UI/UX 개선 및 디자인 시스템 일관성 확립"

### 주요 변경사항

#### 1. 테마 색상 시스템 구축 (`src/app/globals.css`)

**추가된 색상 변수:**
```css
/* Brand Colors */
--brand: oklch(0.55 0.2 280);               /* #7B6CF6 */
--brand-foreground: oklch(1 0 0);          /* #FFFFFF */
--brand-700: oklch(0.35 0.15 280);         /* #4b3f74 - darker brand */
--brand-200: oklch(0.85 0.08 280);         /* #cfc5ff - lighter brand */
--brand-50: oklch(0.95 0.02 280);          /* #f0e8ff - very light brand */

/* Text Colors */
--text-primary: oklch(0.15 0.01 280);      /* #1F1C2B - dark text */
--text-secondary: oklch(0.45 0.03 280);    /* #625a75 - muted text */

/* Gradient Colors */
--gradient-purple: oklch(0.88 0.08 310);   /* #F6D7FF */
--gradient-blue: oklch(0.92 0.03 250);     /* #DCE9FF */
```

#### 2. 공용 UI 컴포넌트 생성

**신규 컴포넌트 5개:**
- `DecorativeCircle.tsx` - 배경 장식 원형 컴포넌트 (size, color, blur, opacity 설정 가능)
- `Logo.tsx` - MalangEE 로고 컴포넌트 wrapper
- `Mascot.tsx` - 마스코트 이미지 컴포넌트 (glow effect)
- `GlassmorphicCard.tsx` - 글래스모피즘 카드 (인증 페이지용)
- `PageBackground.tsx` - 페이지 배경 컴포넌트 (gradient + decorations)

#### 3. 하드코딩 색상 → 테마 변수 마이그레이션

**수정된 파일:**
- `app/auth/login/page.tsx` - `text-[#4b3f74]` → `text-brand-700`
- `app/auth/signup/page.tsx` - `text-[#625a75]` → `text-text-secondary`, `text-[#7B6CF6]` → `text-brand`
- `app/topic-select/page.tsx` - `bg-[#7B6CF6]` → `bg-brand`, `to-[#f0e8ff]/80` → `to-brand-50/80`
- `shared/ui/Button.tsx` - 모든 variant를 테마 변수로 업데이트

**Button variant 업데이트:**
```tsx
primary: "bg-brand text-brand-foreground shadow-[0_10px_30px_rgba(118,102,245,0.35)] hover:bg-brand/90"
"outline-purple": "border-2 border-brand bg-white text-brand hover:bg-brand-50"
secondary: "bg-brand-200 text-brand hover:bg-brand-200/80"
solid: "bg-brand text-brand-foreground shadow-lg hover:bg-brand/90"
```

#### 4. 버그 수정
- `shared/ui/index.ts` - `./Button1` → `./Button` import 경로 수정
- TypeScript 컴파일 오류 해결
- 빌드 성공 확인

### 성과

- ✅ 디자인 시스템 일관성 확보 (하드코딩 색상 제거)
- ✅ 재사용 가능한 공용 컴포넌트 5개 생성
- ✅ Tailwind CSS v4 oklch() 색상 공간 활용
- ✅ 타입 안정성 향상
- ✅ 빌드 및 타입 체크 통과

### 다음 단계 (Phase 2 추가 개선사항)

- [ ] 반응형 디자인 검토 및 최적화
- [ ] 접근성 개선 (ARIA 레이블, 키보드 네비게이션)
- [ ] 애니메이션 및 트랜지션 추가

---

## 📅 문서 작성 이후 작업 내역 (2026-01-11 ~ 2026-01-12)

### 8. 공통 Button 컴포넌트 추가

#### 8.1 Button 컴포넌트 (`src/shared/ui/Button.tsx`)
- **주요 기능**:
  - 다양한 variant 지원: `default`, `outline`, `ghost`, `brand`, `brand-outline`, `primary`, `outline-purple`, `secondary`, `solid`
  - 다양한 size 지원: `default`, `sm`, `md`, `lg`, `xl`, `auto`
  - `fullWidth` 옵션으로 전체 너비 버튼 지원
  - 로딩 상태 표시 (`isLoading` prop)
  - `asChild` prop으로 Slot 패턴 지원 (Radix UI)
  - `class-variance-authority`를 사용한 타입 안전한 variant 관리
- **스타일**: 보라색 계열 브랜드 색상 적용, 둥근 모서리 (`rounded-full`)
- **사용처**: 전체 프로젝트의 버튼을 통일된 컴포넌트로 교체

### 9. 대화 완료 페이지 구현

#### 9.1 대화 완료 페이지 (`src/app/chat/complete/page.tsx`)
- **기능**:
  - 대화 종료 후 완료 화면 표시
  - 총 대화 시간 및 사용자 발화 시간 통계 표시
  - 세션 데이터를 `sessionStorage`에서 읽어와 표시
  - "홈으로 돌아가기" 버튼으로 새로운 대화 시작 페이지로 이동
- **레이아웃**: FullLayout 사용
- **데이터 관리**: `sessionStorage`를 통한 대화 시간 데이터 저장/조회

### 10. 비활동 감지 및 팝업 로직

#### 10.1 비활동 타이머 구현
- **기능**:
  - 사용자 비활동 15초 후 안내 메시지 표시
  - 추가 5초 후 응답 대기 팝업 표시
  - 사용자 응답 시 타이머 자동 리셋
- **적용 페이지**:
  - 시나리오 선택 페이지 (`src/app/auth/scenario-select/page.tsx`)
  - 대화 페이지 (`src/app/chat/conversation/page.tsx`)
- **UX 개선**: 사용자가 대화 중 멈춰있을 때 적절한 안내 제공

### 11. 대화 상태 관리 개선

#### 11.1 대화 상태 관리 로직
- **기능**:
  - 대화 상태 테스트 버튼 추가 (개발용)
  - 자막 토글 기능 추가
  - 대화 상태에 따른 UI 업데이트
- **상태 관리**: React hooks를 사용한 상태 관리 개선

### 12. 로그인 팝업 추가

#### 12.1 로그인 팝업 구현
- **기능**:
  - 팝업 형태의 로그인 UI
  - 마이크 버튼 기능 수정 및 개선
- **UX 개선**: 전체 페이지 전환 없이 로그인 가능

### 13. 말랭이 대화 설정 페이지

#### 13.1 대화 설정 페이지 추가
- **기능**:
  - 대화 시작 전 설정 옵션 제공
  - 사용자 선호도 설정
- **레이아웃**: 일관된 디자인 시스템 적용

### 14. PopupLayout 개선

#### 14.1 PopupLayout 리팩토링
- **개선사항**:
  - 닫기 버튼 위치 조정
  - 헤더 구조 개선
  - 더 나은 접근성 및 UX

### 15. 에러 처리 개선

#### 15.1 중복 체크 에러 처리 개선 (`src/features/auth/hook/use-duplicate-check.ts`)
- **개선사항**:
  - 상세한 에러 메시지 표시
  - 네트워크 에러, 404, 500 등 에러 타입별 다른 메시지
  - 콘솔 로깅을 통한 디버깅 지원
  - 사용자 친화적인 에러 메시지

#### 15.2 API 클라이언트 URL 처리 개선 (`src/shared/lib/api-client.ts`)
- **개선사항**:
  - 상대 경로 URL 처리 개선
  - 개발 환경에서 Next.js rewrites와 호환
  - `window.location.origin`을 base URL로 사용하는 로직 추가

### 16. 개발 환경 개선

#### 16.1 nodemon 추가
- **기능**: 개발 중 파일 변경 시 자동 재시작
- **설정**: `package.json`에 nodemon 설정 추가

#### 16.2 테스트 라이브러리 업데이트
- **변경사항**:
  - `@testing-library/react` 및 관련 패키지 버전 업데이트
  - 테스트 환경 안정성 개선

### 17. 배포 스크립트 개선

#### 17.1 배포 스크립트 개선
- **개선사항**:
  - `npm install` 및 빌드 프로세스에 타임아웃 처리 추가
  - Next.js 및 FastAPI 서버 시작 시 health check 추가
  - 패키지 의존성 업데이트
- **안정성**: 배포 프로세스의 안정성 및 신뢰성 향상

### 18. Copilot Instructions 추가

#### 18.1 Copilot 설정 파일 추가
- **기능**: MaLangEE 아키텍처 및 워크플로우에 대한 포괄적인 Copilot 지시사항 추가
- **목적**: AI 어시스턴트가 프로젝트 구조와 패턴을 더 잘 이해하도록 지원

## 📊 업데이트 통계 (2026-01-11 이후)

```
추가 작업:
- Button 컴포넌트 추가 및 전역 적용
- 대화 완료 페이지 추가
- 비활동 감지 로직 추가
- 에러 처리 개선
- 배포 스크립트 개선
- 개발 환경 도구 추가
```

## 👥 작성자

- Claude Code AI Assistant
- 작성일: 2026-01-11
- 최종 업데이트: 2026-01-12

---

**Note**: 이 문서는 feature/design 브랜치의 작업 내역을 정리한 것입니다. main 브랜치로 병합 전 코드 리뷰가 필요합니다.
