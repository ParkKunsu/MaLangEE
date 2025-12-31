# MaLangEE

AI 기반 언어 학습 플랫폼으로, 자동 배포 기능과 완전한 개발 환경이 적용된 엔터프라이즈 프로젝트입니다.

> 📖 **가이드 바로가기**
> - ℹ️ **프로젝트 핵심 정보**: [docs/00-PROJECT_INFO.md](docs/00-PROJECT_INFO.md)
> - 💻 **개발자 가이드 (Local)**: [docs/01-DEV_GUIDE.md](docs/01-DEV_GUIDE.md)
> - ⚙️ **서버 운영 가이드 (Ops)**: [docs/02-SERVER_OPS.md](docs/02-SERVER_OPS.md)

---

## 📋 공통 설정 파일 (config.sh)

모든 설치/배포 스크립트는 **중앙 집중식 설정 파일**을 사용합니다.

**설정 파일 위치**: `scripts/config.sh`

**주요 설정 항목**:
```bash
# 프로젝트 정보
PROJECT_NAME="MaLangEE"
SERVICE_NAME="malangee"
GITHUB_REPO="https://github.com/MaLangEECoperation/MaLangEE.git"

# 배포 사용자
DEPLOY_USER="aimaster"

# 웹 서버 (Nginx)
DOMAIN_NAME="localhost"
PROJECT_PATH="/"
FRONTEND_HOST="localhost"
FRONTEND_PORT="3000"
BACKEND_HOST="localhost"
BACKEND_PORT="8080"

# 데이터베이스
DB_NAME="malangee"
DB_USER="aimaster"
DB_PASSWORD="****"
```

**장점**:
- 🎯 한 곳에서 모든 설정 관리
- 🔄 일관성 있는 설정 값 사용
- 🚀 새로운 환경 설정 시 빠른 적용
- 📝 설정 변경 시 스크립트 수정 없음

---

## ✨ 주요 기능

- ✅ **자동 배포**: 10분마다 GitHub 코드 자동 동기화
- ✅ **Cron 기반**: 별도 설정 없이 자동 실행
- ✅ **멀티스택 개발**: Java, Node.js, Python 지원
- ✅ **PostgreSQL**: 강력한 데이터베이스
- ✅ **AI 엔진**: 기계학습 기반 언어 학습 분석
- ✅ **중앙 설정 관리**: 공통 설정 파일로 일관성 유지
- ⏸️ **GitHub Actions**: 선택사항 (빠른 배포 원할 시 추가 설정)

---

## 🚀 빠른 시작

### 1️⃣ 서버 초기화 (Ubuntu - 처음 한 번만)
```bash
# Ubuntu 서버 초기 설정 (사용자, Git, Cron 자동 배포)
sudo bash scripts/1-init_server.sh
```

### 2️⃣ 개발 환경 설치 (로컬 또는 서버)
```bash
# 개발 환경 자동 설치 (Java, Node.js, Python, PostgreSQL)
bash scripts/2-setup_env.sh
```

### 3️⃣ 웹 서버 설정 (선택사항 - 웹 접속 시)
```bash
# Frontend와 Backend를 웹(포트 80)으로 접속 가능하게 설정
sudo bash scripts/3-setup_web.sh

# 대화형 설정:
# - Frontend 포트 (기본값: 3000)
# - Backend 포트 (기본값: 8080)
# - 도메인/IP (기본값: localhost)
# - 프로젝트 경로 (기본값: /) 예: /malangee

# 공인 IP 49.50.137.35에 /malangee 경로로 설정한 경우:
# - Frontend: http://49.50.137.35/malangee
# - Backend API: http://49.50.137.35/malangee/api
```

### 4️⃣ 배포 상태 확인
```bash
# 배포 로그 실시간 확인
tail -f /var/log/MaLangEE_deploy.log
```

### 5️⃣ 저장소 상태 확인
```bash
cd /home/aimaster/projects/MaLangEE && git status
```

### 6️⃣ 배포 수동 실행
```bash
/home/aimaster/projects/malangee/scripts/deploy.sh
```

---

## 🔧 배포 설정 정보

| 항목 | 값 |
|------|-----|
| **배포 사용자** | aimaster |
| **프로젝트 경로** | /home/aimaster/projects/MaLangEE |
| **GitHub 저장소** | https://github.com/MaLangEECoperation/MaLangEE.git |
| **브랜치** | main |
| **배포 방식** | Cron (10분마다) |
| **배포 스크립트** | /home/aimaster/projects/malangee/scripts/deploy.sh |
| **배포 로그** | /var/log/MaLangEE_deploy.log |

---

## 📁 프로젝트 구조

```
MaLangEE/
├── frontend/                    # React/Vue 프론트엔드 애플리케이션
│   ├── index.html              # 프론트엔드 상태 페이지
│   ├── node_modules/           # npm 의존성
│   └── ...
├── backend/                     # Java Spring Boot REST API 서버
│   ├── index.html              # API 문서 페이지
│   ├── pom.xml                 # Maven 설정
│   ├── src/                    # Java 소스코드
│   ├── target/                 # Build 결과물
│   └── ...
├── ai-engine/                   # Python 기반 AI 학습 엔진
│   ├── venv/                   # Python 가상환경
│   └── ...
├── database/                    # PostgreSQL 데이터베이스
│   ├── data/                   # 데이터베이스 데이터
│   └── ...
├── docs/                        # 📚 문서 모음
│   ├── 00-PROJECT_INFO.md       # ℹ️ 프로젝트 핵심 정보
│   ├── 01-DEV_GUIDE.md          # 💻 개발자 가이드
│   └── 02-SERVER_OPS.md         # ⚙️ 서버 운영 가이드
├── scripts/                     # 배포 및 설정 스크립트 (단계별 실행)
│   ├── config.sh               # 공통 설정 파일 (중앙 관리)
│   ├── 1-init_server.sh        # 1️⃣ Ubuntu 서버 초기화
│   ├── 2-setup_env.sh          # 2️⃣ 개발 환경 설치
│   ├── 3-setup_web.sh          # 3️⃣ Nginx 웹 서버 설정
│   └── deploy.sh               # 배포 스크립트 (Cron 실행)
└── README.md                    # 프로젝트 소개 (이 파일)
```

---

## ⚙️ 설정 파일 수정 (config.sh)

기본값이 아닌 다른 환경에서 실행할 경우, `scripts/config.sh`를 수정하세요.

### 예: 공인 IP와 프로젝트 경로 설정

```bash
# scripts/config.sh 수정
export DOMAIN_NAME="49.50.137.35"
export PROJECT_PATH="/malangee"
export DEPLOY_USER="your_username"  # 필요시
```

### 예: 다른 데이터베이스 계정

```bash
# scripts/config.sh 수정
export DB_NAME="custom_db"
export DB_USER="custom_user"
export DB_PASSWORD="secure_password"
```

**주의**: 각 스크립트는 대화형으로 실행 중 사용자 입력을 받으므로,  
설정 파일의 기본값은 단순히 제안값으로 사용됩니다.

---

## 🛠️ 개발 환경 요구사항

| 도구 | 버전 | 용도 |
|------|------|------|
| **Java** | 17+ | Spring Boot Backend |
| **Node.js** | 18+ | Frontend |
| **npm** | 9+ | 패키지 관리 (Frontend) |
| **Maven** | 3.8+ | 패키지 관리 (Backend) |
| **Python** | 3.9+ | AI Engine |
| **PostgreSQL** | 13+ | 데이터베이스 |
| **Git** | 2.30+ | 버전 관리 |

---

## �📋 Cron 자동 배포

### 작동 방식
```
매 10분마다 자동 실행
    ↓
git fetch origin main
    ↓
git reset --hard origin/main
    ↓
배포 완료 (로그 기록)
```

### Cron 설정 확인
```bash
crontab -u aimaster -l
# 출력: */10 * * * * /home/aimaster/deploy.sh >> /var/log/MaLangEE_deploy.log 2>&1
```

---

## ⚙️ 개발 환경 설치 및 설정

### 1️⃣ 자동 설치 (권장)

```bash
# 모든 개발 환경을 자동으로 설치합니다 (Java, Node.js, Python, PostgreSQL)
bash scripts/2-setup_env.sh
```

### 2️⃣ 의존성 설치

```bash
# Frontend 설치
cd frontend
npm install

# Backend 설치 (Maven)
cd ../backend
mvn clean install

# AI Engine 설치 (Python)
cd ../ai-engine
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3️⃣ 데이터베이스 초기화

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성 (필요시)
CREATE DATABASE malangee;

# 초기 SQL 스크립트 실행
psql -U postgres -d malangee -f database/init.sql
```

---

## 📚 상세 가이드

| 문서 | 목적 |
|------|------|
| [docs/02-DEPLOYMENT_GUIDE.md](docs/02-DEPLOYMENT_GUIDE.md) | 🚀 배포 관리 & 모니터링 |

---

## ⚡ 자주 사용되는 명령어

### 배포 모니터링
```bash
# 배포 로그 보기 (실시간)
tail -f /var/log/MaLangEE_deploy.log

# 최근 배포 로그 보기
tail -20 /var/log/MaLangEE_deploy.log

# 배포 횟수 확인 (오늘)
grep "$(date +%Y-%m-%d)" /var/log/MaLangEE_deploy.log | wc -l
```

### 저장소 관리
```bash
# 저장소 상태 확인
cd /home/aimaster/projects/MaLangEE && git status

# 최근 커밋 확인
cd /home/aimaster/projects/MaLangEE && git log --oneline -5

# 원격과 비교
cd /home/aimaster/projects/MaLangEE && git fetch origin main
```

### 배포 관리
```bash
# 지금 바로 배포
/home/aimaster/deploy.sh

# Cron 설정 확인
crontab -u aimaster -l

# 서비스 상태 확인
sudo systemctl status cron
```

---

## 🔄 배포 흐름

### GitHub에 Push 후
```
1. GitHub에 코드 push
   ↓
2. (최대 10분 대기)
   ↓
3. Cron이 자동으로 배포 스크립트 실행
   ↓
4. 서버의 코드 자동 업데이트
   ↓
5. 배포 로그에 기록
```

### 또는 수동 배포
```
1. /home/aimaster/projects/malangee/scripts/deploy.sh 실행
   ↓
2. git pull 실행
   ↓
3. 배포 완료
```

---

## 🚀 개발 모드 실행

### 로컬 개발 환경에서 실행

**터미널 1 - Frontend:**
```bash
cd frontend
npm run dev
# 접속: http://localhost:3000
```

**터미널 2 - Backend (Spring Boot):**
```bash
cd backend
mvn spring-boot:run
# 접속: http://localhost:8080/api
```

**터미널 3 - AI Engine (선택):**
```bash
cd ai-engine
source venv/bin/activate
python main.py
```

### Nginx를 통한 통합 접속

```bash
# 위의 터미널 1, 2를 먼저 실행한 후
# 별도 터미널에서:
sudo systemctl start nginx

# 웹 접속
http://localhost/        # Frontend
http://localhost/api     # Backend API
```

---

## 🆘 문제 해결

### 배포가 안 될 때
```bash
# 1. 배포 로그 확인
tail -f /var/log/MaLangEE_deploy.log

# 2. Cron 상태 확인
sudo systemctl status cron

# 3. 저장소 상태 확인
cd /home/aimaster/projects/MaLangEE && git status

# 4. 수동 배포 테스트
/home/aimaster/projects/malangee/scripts/deploy.sh
```

### Cron 서비스 재시작
```bash
# Cron 시작
sudo systemctl start cron

# 자동 시작 설정
sudo systemctl enable cron
```

---

## � 문서 (Documentation)

프로젝트 문서는 `docs/` 디렉토리에 정리되어 있습니다.

```
docs/
├── 00-PROJECT_INFO.md   # ℹ️ 프로젝트 핵심 정보 (IP, 포트, 계정)
├── 01-DEV_GUIDE.md      # 💻 개발자 가이드 (로컬 실행 방법)
└── 02-SERVER_OPS.md     # ⚙️ 서버 운영 가이드 (배포 및 관리)
```

### ℹ️ [00-PROJECT_INFO.md](docs/00-PROJECT_INFO.md)
모든 팀원이 가장 먼저 확인해야 할 문서입니다.
- 서비스 접속 URL
- 서버 IP 및 SSH 접속 정보
- 기술 스택 버전 및 포트 맵

### 💻 [01-DEV_GUIDE.md](docs/01-DEV_GUIDE.md)
개발자가 로컬 환경(Windows/Mac)에서 프로젝트를 실행하는 방법입니다.
- 필수 설치 도구 (Git, JDK, Node 등)
- Backend, Frontend, AI Engine 실행 명령어
- 트러블슈팅

### ⚙️ [02-SERVER_OPS.md](docs/02-SERVER_OPS.md)
서버 관리자가 배포 환경을 구축하고 운영하는 방법입니다.
- 초기 서버 세팅 스크립트 사용법
- 자동 배포(Cron) 관리 및 로그 확인
- Nginx 설정 및 문제 해결

---

## �📝 개발 워크플로우

### 1️⃣ 로컬에서 개발
```bash
git clone https://github.com/MaLangEECoperation/MaLangEE.git
cd MaLangEE
# 코드 수정...
```

### 2️⃣ 커밋 및 푸시
```bash
git add .
git commit -m "기능 설명"
git push origin main
```

### 3️⃣ 자동 배포 (10분 이내)
- Cron이 자동으로 배포 실행
- 또는 수동으로 `/home/aimaster/deploy.sh` 실행

### 4️⃣ 배포 확인
```bash
# 배포 로그 확인
tail -f /var/log/MaLangEE_deploy.log

# 서버의 코드 확인
cd /home/aimaster/projects/MaLangEE && git log --oneline -1
```

---

## ✅ 배포 체크리스트

### 배포 전
- [ ] GitHub에 변경사항 push됨
- [ ] 현재 저장소 상태 확인: `git status`

### 배포 중
- [ ] Cron이 10분마다 자동 실행 중
- [ ] 또는 수동으로 배포: `/home/aimaster/deploy.sh`

### 배포 후
- [ ] 배포 로그에 "배포 완료" 메시지 확인
- [ ] 서버의 최신 커밋 확인: `git log --oneline -1`

---

## 📌 주의사항

⚠️ **배포 정책**
- 모든 변경은 **GitHub**에서만 관리
- 서버에서 수동 수정 금지 (배포 시 덮어써짐)
- Cron이 **10분마다** 실행되므로 최대 10분 지연

---
