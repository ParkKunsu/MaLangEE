# 💻 개발자 가이드 (Local Development)

> **Windows 11 또는 Mac 로컬 환경에서 MaLangEE를 실행하기 위한 가이드입니다.**  
> 필수 도구 설치 후, 각 모듈을 로컬에서 실행하는 방법을 안내합니다.

---

## ✅ 필수 설치 체크리스트

개발 시작 전 다음 도구들이 설치되어 있어야 합니다.

1. **Git**: [Download](https://git-scm.com/download/win)
2. **Java JDK 17**: [OpenJDK 17](https://adoptopenjdk.net/) (환경변수 `JAVA_HOME` 설정 필수)
3. **Node.js (v18 LTS)**: [Download](https://nodejs.org/)
4. **Python 3.9+**: [Download](https://www.python.org/downloads/) ("Add to PATH" 체크)
5. **PostgreSQL**: [Download](https://www.postgresql.org/download/windows/) (Port: 5432)
6. **IDE**: VS Code 또는 IntelliJ IDEA 추천

---

## 🚀 프로젝트 설정 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/MaLangEECoperation/MaLangEE.git
cd MaLangEE
```

### 2. 데이터베이스 설정
로컬 PostgreSQL에 접속하여 DB와 사용자를 생성합니다.
```sql
CREATE DATABASE malangee;
CREATE USER malangee_user WITH PASSWORD 'malangee_password';
GRANT ALL PRIVILEGES ON DATABASE malangee TO malangee_user;
```

### 3. 모듈별 실행 방법

#### 🅰️ Backend (Spring Boot)
```bash
cd backend

# 의존성 설치 및 빌드
./mvnw clean install

# 로컬 개발 모드 실행
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=local"
```
- 접속: `http://localhost:8080/api/health`
- 설정 파일: `src/main/resources/application-local.properties`

#### 🅱️ Frontend (React + Next.js)
```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```
- 접속: `http://localhost:3000/`
- 설정 파일: `.env.development` (API_BASE_URL 자동 설정)

#### 🅾️ AI Engine (Python)
```bash
cd ai-engine

# 가상환경 생성 및 활성화
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 실행
python app.py
```
- 접속: `http://localhost:5000`

---

## 🌐 로컬 API 접속 정보

각 모듈이 실행되면 다음 포트에서 접근 가능합니다:

| 서비스 | URL | 설명 |
|---|---|---|
| **Frontend** | `http://localhost:3000` | 개발 서버 (Next.js) |
| **Backend** | `http://localhost:8080/api` | REST API |
| **AI Engine** | `http://localhost:5000` | AI 분석 서비스 |
| **Database** | `localhost:5432` | PostgreSQL |

---

## 🔧 환경 설정 파일

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```
Next.js는 `NEXT_PUBLIC_` 접두사가 붙은 환경 변수를 클라이언트에서 사용할 수 있습니다.

### Backend (application-local.properties)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/malangee
spring.datasource.username=malangee_user
spring.datasource.password=malangee_password
server.port=8080
```

---

## 🐞 트러블슈팅 (자주 묻는 질문)

**Q. `mvnw` 실행 권한 오류가 발생해요.**
A. PowerShell에서 `./mvnw` 대신 `mvn` 명령어를 직접 사용하거나, Git Bash에서 `chmod +x mvnw`를 실행하세요.

**Q. DB 연결이 안 돼요.**
A. `src/main/resources/application-local.properties` 파일의 DB URL, Username, Password가 로컬 설정과 일치하는지 확인하세요.

**Q. 포트 충돌이 발생해요.**
A. 이미 해당 포트(8080, 3000 등)를 사용하는 프로세스를 종료하거나, 각 모듈의 설정 파일에서 포트를 변경하세요.

**Q. API 호출이 실패해요.**
A. Frontend의 `.env.local` 파일에서 `NEXT_PUBLIC_API_BASE_URL`이 올바른 Backend 주소를 가리키는지 확인하세요.

