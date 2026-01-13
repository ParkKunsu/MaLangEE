# 말랭이 (MaLangEE) 프로젝트 개요

## 프로젝트 목적
AI 기반 실시간 영어 회화 학습 플랫폼
- **핵심 가치**: 초저지연(0.5초 이내) 실시간 음성 대화 및 피드백
- **주요 기능**: WebSocket 기반 음성 STT/TTS, 시나리오 기반 대화 학습

## 아키텍처
모노레포 구조의 멀티스택 프로젝트:
- **Frontend**: Next.js 16 + React 19 (포트 3000)
- **Backend**: FastAPI (포트 8080) - OpenAI Realtime API 통합
- **Database**: PostgreSQL (포트 5432)

## 서버 정보
- **개발 서버**: http://49.50.137.35:3000 (Frontend)
- **API 서버**: http://49.50.137.35:8080/api
- **WebSocket**: ws://49.50.137.35:8080/api/v1/ws

## 배포 방식
- Cron 기반 자동 배포 (10분 간격)
- Git pull 기반 무중단 배포
- 배포 로그: `/var/log/MaLangEE_deploy.log`
