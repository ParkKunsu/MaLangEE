# Phase 4 프로젝트 개요

## 프로젝트 정보
- **서비스명**: 말랭이 (MaLangEE)
- **핵심 가치**: AI 기반 실시간 영어 회화 학습 플랫폼
- **기술 스택**: Next.js 16 + React 19 + TypeScript, Tailwind CSS v4 + shadcn/ui
- **백엔드**: FastAPI + OpenAI Realtime API + PostgreSQL
- **서버 정보**:
  - Frontend: http://49.50.137.35:3000
  - Backend API: http://49.50.137.35:8080/api
  - WebSocket: ws://49.50.137.35:8080/api/v1/ws

## Phase 4 목표
**대시보드 및 학습 기능 페이지 구현**
- 사용자 대시보드와 다양한 학습 기능 페이지 구현
- Quick Response, Think Aloud, Rephrasing, Daily Reflection 등 학습 모드 구현

## 선행 완료 사항 (Phase 1-3)
- Phase 1: FSD 아키텍처 적용 완료 (shared, entities, features 레이어 구조화)
- Phase 2: UI/UX 개선 (Tailwind CSS v4 테마 변수, 공용 컴포넌트 추가)
- Phase 3: 음성 녹음 및 WebSocket 기능 구현 완료

## Phase 4 의존성
- Phase 2 (UI/UX) 완료 권장
- Phase 3 (음성/WebSocket) 완료 권장

## 주요 학습 모드
1. Quick Response - 빠른 응답 연습
2. Think Aloud - 생각을 말로 표현하기
3. Rephrasing - 다른 표현으로 바꾸기
4. Daily Reflection - 하루 반성 일지
5. Progress - 학습 진행 상황
6. Scenario Chat - 시나리오 대화 (Phase 3에서 구현됨)