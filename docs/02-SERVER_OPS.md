# ⚙️ 서버 운영 가이드 (Server Operations)

> **서버 관리자를 위한 배포, 설정, 운영 가이드입니다.**  
> 초기 서버 세팅부터 자동 배포 관리, 문제 해결 방법을 다룹니다.

---

## � 현재 구조: 포트 기반 (Port-Based Architecture)

더 이상 **Nginx를 사용하지 않습니다**. 대신 각 서비스가 고유 포트에서 직접 실행됩니다.

```
Frontend:   49.50.137.35:3000  → Next.js Development Server
Backend:    49.50.137.35:8080  → Spring Boot Application
AI Engine:  49.50.137.35:5000  → Python Flask/FastAPI
Database:   49.50.137.35:5432  → PostgreSQL
```

**장점:**
- ✅ Nginx 설정 불필요 (단순함)
- ✅ 경로 변환 없음 (명확함)
- ✅ 개발/배포 환경 동일

---

## �🏗️ 초기 서버 구축 (Initial Setup)

새로운 Ubuntu 서버를 세팅할 때 다음 스크립트를 순서대로 실행하세요.
(스크립트 위치: `scripts/`)

### 1단계: 서버 초기화 (`1-init_server.sh`)
- **역할**: 배포 사용자(`aimaster`) 생성, Git 설치, Cron 등록
- **실행**: `root` 권한 필요
```bash
sudo ./scripts/1-init_server.sh
```

### 2단계: 환경 설정 (`2-setup_env.sh`)
- **역할**: Java, Node.js, Python, PostgreSQL 설치
- **실행**: `aimaster` 계정 권장
```bash
./scripts/2-setup_env.sh
```

**주의**: 3단계 웹 서버 설정(`3-setup_web.sh`)은 더 이상 필요하지 않습니다.

---

## 🔄 자동 배포 시스템 (Auto Deployment)

MaLangEE는 **Cron**을 이용해 10분마다 GitHub의 변경사항을 자동으로 배포합니다.

### 동작 원리
```
1. Cron이 10분마다 /home/aimaster/deploy.sh 실행
   ↓
2. GitHub main 브랜치 변경 사항 확인 (git fetch)
   ↓
3. 변경이 있으면:
   - git pull (코드 다운로드)
   - npm run build (Frontend)
   - mvn package (Backend)
   - ./deploy.sh restart (서비스 재시작)
   ↓
4. 변경이 없으면 종료
   ↓
5. 배포 로그 기록 (/var/log/MaLangEE_deploy.log)
```

### 배포 관리 명령어

**수동 배포 (즉시 적용)**
```bash
/home/aimaster/deploy.sh
# 또는 서비스 재시작만
/home/aimaster/deploy.sh restart
```

**배포 로그 확인**
```bash
# 실시간 로그
tail -f /var/log/MaLangEE_deploy.log

# 최근 배포 로그
tail -50 /var/log/MaLangEE_deploy.log

# 배포 횟수 확인 (오늘)
grep "$(date +%Y-%m-%d)" /var/log/MaLangEE_deploy.log | wc -l
```

**Cron 설정 확인**
```bash
# Cron 상태
sudo systemctl status cron

# 등록된 Cron 작업
crontab -u aimaster -l

# Cron 재시작 (필요시)
sudo systemctl restart cron
```

---

## � 서비스 관리

### 서비스 상태 확인

**모든 서비스 상태 확인**
```bash
# Frontend 상태
ps aux | grep "vite\|npm run dev"

# Backend 상태
ps aux | grep "java\|spring"

# AI Engine 상태
ps aux | grep "python.*app"
```

### 서비스 재시작

**전체 서비스 재시작**
```bash
/home/aimaster/deploy.sh restart
```

**개별 서비스 재시작**
```bash
# 필요한 경우 수동으로 서비스 재시작
# (현재 systemd 서비스가 아니라 스크립트로 관리되고 있음)
```

### API 연결 테스트

**Backend API 테스트**
```bash
curl http://49.50.137.35:8080/api/health
```

**Frontend 테스트**
```bash
curl http://49.50.137.35:3000/
```

---

## 🔧 환경 설정

### Frontend 환경 설정 (.env.production)
```bash
# /home/aimaster/projects/MaLangEE/frontend/.env.production
VITE_API_BASE_URL=http://49.50.137.35:8080
```

### Backend 환경 설정
```bash
# /home/aimaster/projects/MaLangEE/backend/src/main/resources/application.properties
server.port=8080
server.servlet.context-path=/   # 루트 경로
spring.datasource.url=jdbc:postgresql://localhost:5432/malangee
spring.datasource.username=malangee_user
spring.datasource.password=malangee_password
```

---

## 🚨 문제 해결 (Troubleshooting)

### 1. 배포가 되지 않을 때
```bash
# 로그 확인
tail -f /var/log/MaLangEE_deploy.log

# 권한 확인
ls -la /home/aimaster/deploy.sh

# 수동 배포 테스트
/home/aimaster/deploy.sh
```

**일반적인 원인:**
- Git 권한 문제 → `git config --global user.email/name` 설정
- 로컬 파일 수정 → `git reset --hard origin/main` 초기화
- Cron 비활성화 → `sudo systemctl enable cron`

### 2. 서비스 접속 불가

**Frontend 접속 불가 (http://49.50.137.35:3000/)**
```bash
# Next.js 프로세스 확인
ps aux | grep vite

# 포트 점유 확인
sudo lsof -i :3000

# 프로세스 강제 종료
kill -9 <PID>

# 수동 재시작
cd /home/aimaster/projects/MaLangEE/frontend
npm run dev
```

**Backend 접속 불가 (http://49.50.137.35:8080/api)**
```bash
# Java 프로세스 확인
ps aux | grep java

# 포트 점유 확인
sudo lsof -i :8080

# 프로세스 강제 종료
kill -9 <PID>

# 수동 재시작
cd /home/aimaster/projects/MaLangEE/backend
mvn spring-boot:run
```

### 3. DB 연결 오류
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# PostgreSQL 시작
sudo systemctl start postgresql

# DB 접속 테스트
psql -h localhost -U malangee_user -d malangee

# DB 로그 확인
sudo tail -f /var/log/postgresql/postgresql.log
```

### 4. Cron 배포 로그 오류 예시 및 해결

**"fatal: Could not read from remote repository"**
- 원인: Git 권한 문제
- 해결: SSH 키 확인 → `ssh-keygen` 및 GitHub에 공개키 등록

**"npm: command not found"**
- 원인: Node.js 설치 경로 문제
- 해결: `source ~/.bashrc` 후 Shell 재실행 또는 Full Path 사용

**"Permission denied"**
- 원인: 파일 소유권 문제
- 해결: `chmod +x /home/aimaster/deploy.sh` 및 `chown aimaster:aimaster /home/aimaster/projects/MaLangEE`

---

## 📊 배포 통계

**배포 횟수 확인 (오늘)**
```bash
grep "$(date +%Y-%m-%d)" /var/log/MaLangEE_deploy.log | wc -l
```

**최근 배포 기록**
```bash
tail -20 /var/log/MaLangEE_deploy.log
```

**배포 성공/실패 통계**
```bash
# 성공한 배포
grep "배포 완료\|SUCCESS" /var/log/MaLangEE_deploy.log | wc -l

# 실패한 배포
grep "ERROR\|FAILED" /var/log/MaLangEE_deploy.log | wc -l
```

---

## ✅ 일일 점검 체크리스트

### 매일 아침
- [ ] Cron 작동 확인: `tail -f /var/log/MaLangEE_deploy.log`
- [ ] Frontend 접속 확인: `curl http://49.50.137.35:3000/`
- [ ] Backend API 접속 확인: `curl http://49.50.137.35:8080/api/health`
- [ ] DB 접속 확인: `psql -h localhost -U malangee_user -d malangee`

### 주 1회 (매주 월요일)
- [ ] Git 저장소 상태 확인: `git status`
- [ ] 디스크 용량 확인: `df -h`
- [ ] 로그 파일 정리: 오래된 배포 로그 백업
- [ ] 보안 업데이트 확인: `sudo apt update && apt list --upgradable`

---

## 🔐 보안 권장사항

1. **SSH 접근 제한**: firewall 규칙으로 특정 IP만 허용
2. **배포 권한**: `aimaster` 계정만 배포 스크립트 실행 가능하게 설정
3. **DB 암호**: 강력한 암호 사용 및 정기 변경
4. **로그 정리**: 개인정보 포함 로그는 정기적으로 삭제
5. **백업**: DB와 코드 저장소 정기 백업

