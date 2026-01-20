# MaLangEE Backend Service

MaLangEE 플랫폼의 메인 백엔드 서비스입니다.
AI Engine과 분리되어 **데이터 저장, 사용자 관리, 비즈니스 로직**을 담당합니다.

Java(Spring Boot) 개발자분들이 Python(FastAPI) 환경에 적응하기 쉽도록 상세하게 설명합니다.

---

## 🛠 기술 스택 (Tech Stack)

| 구분 | 기술 (Python) | 설명 (Java 대응 개념) |
|------|--------------|------------------------|
| **언어** | **Python 3.11** | Java 17+ |
| **프레임워크** | **FastAPI** | Spring Boot (Web) |
| **서버** | **Uvicorn** | Tomcat / Netty (WAS) |
| **ORM** | **SQLAlchemy (Async)** | Hibernate / JPA |
| **데이터 검증** | **Pydantic** | Lombok + Validation (@NotNull 등) |
| **의존성 관리** | **Poetry** | Maven / Gradle |
| **DB** | **PostgreSQL** | PostgreSQL |

---

## 📂 프로젝트 구조 및 파일 상세 설명 (File Details)

프로젝트의 각 파일이 무슨 역할을 하는지 상세히 설명합니다.

### 1. 설정 및 진입점 (Configuration & Entry)

#### `pyproject.toml`
*   **역할**: 프로젝트 설정 및 의존성 관리 파일.
*   **Java 비유**: `pom.xml` 또는 `build.gradle`
*   **내용**: 사용할 패키지(FastAPI, SQLAlchemy 등)와 버전, 파이썬 버전 등이 명시되어 있습니다.

#### `app/main.py`
*   **역할**: 애플리케이션의 시작점(Entry Point).
*   **Java 비유**: `MaLangBeApplication.java` (메인 클래스)
*   **상세**:
    *   `FastAPI()` 앱 객체를 생성합니다.
    *   `lifespan`: 서버 시작/종료 시 실행될 로직을 정의합니다. (지금은 서버 켜질 때 DB 테이블을 자동 생성하는 코드가 들어있습니다.)
    *   `CORSMiddleware`: 프론트엔드에서의 접근 허용 설정.

#### `app/core/config.py`
*   **역할**: 환경 설정 관리 클래스.
*   **Java 비유**: `application.properties` 또는 `@ConfigurationProperties`
*   **상세**:
    *   `BaseSettings`를 상속받아 환경변수 타입 검증을 수행합니다.
    *   시스템 환경변수 > `.env` 파일 > 기본값 순서로 설정을 로드합니다.
    *   `DATABASE_URL` 같은 파생된 설정값도 여기서 조합합니다.

---

### 2. 데이터베이스 (Database Layer)

#### `app/db/database.py`
*   **역할**: DB 연결 엔진 및 세션 설정.
*   **Java 비유**: `DataSourceConfig`
*   **상세**:
    *   `create_async_engine`: 비동기 DB 커넥션 풀을 생성합니다.
    *   `get_db()`: API 요청마다 DB 세션을 하나씩 나눠주고, 요청이 끝나면 닫는(Close) 의존성 주입(Dependency Injection) 함수입니다.

#### `app/db/models.py`
*   **역할**: 데이터베이스 테이블 정의 (ORM).
*   **Java 비유**: `@Entity` 클래스들
*   **상세**:
    *   `ConversationSession`: 대화방 테이블.
    *   `ChatMessage`: 대화 내용 테이블.
    *   `relationship`: JPA의 `@OneToMany` 처럼 테이블 간 관계를 정의합니다.

---

### 3. 데이터 및 로직 (Data & Logic Layer)

#### `app/schemas/chat.py`
*   **역할**: 데이터 전송 객체 (DTO) 및 유효성 검사.
*   **Java 비유**: `CreateUserRequest.java` (DTO) + `@Valid`
*   **상세**:
    *   DB 모델(`models.py`)과 달리, API 입출력에 딱 필요한 필드만 정의합니다.
    *   클라이언트가 잘못된 데이터(예: 필수값 누락)를 보내면 여기서 422 에러로 튕겨냅니다.

#### `app/repositories/session_repository.py`
*   **역할**: DB에 직접 쿼리를 날리는 계층.
*   **Java 비유**: `SessionRepository` (JPA Repository / DAO)
*   **상세**:
    *   `create_session_log`: 세션과 메시지 리스트를 한 번에 저장하는 트랜잭션 로직이 구현되어 있습니다.
    *   SQLAlchemy의 `async session`을 사용하여 비동기로 저장합니다.

---

### 4. API (Interface Layer)

#### `app/api/v1/auth.py`
*   **역할**: 인증 및 회원가입 관련 API.
*   **Java 비유**: `AuthController.java`
*   **상세**:
    *   `POST /signup`: 회원가입 처리.
    *   `POST /login`: OAuth2 호환 로그인 및 JWT 토큰 발급.
    *   `POST /check-login-id`, `POST /check-nickname`: 중복 확인 API.

#### `app/api/v1/users.py`
*   **역할**: 사용자 정보 관리 API.
*   **Java 비유**: `UserController.java`
*   **상세**:
    *   `GET /me`: 내 정보 조회.
    *   `PUT /me`: 내 정보 수정.
    *   `DELETE /me`: 회원 탈퇴 (Soft Delete).

#### `app/api/v1/scenario.py`
*   **역할**: 시나리오(대화 주제) 관리 및 실시간 주제 생성 API.
*   **Java 비유**: `ScenarioController.java`
*   **상세**:
    *   `GET /`: 전체 시나리오 목록 조회.
    *   `GET /{scenario_id}`: 시나리오 상세 조회.
    *   `WS /ws/scenario`: (회원용) 실시간 주제 생성 WebSocket.
    *   `WS /ws/guest-scenario`: (게스트용) 실시간 주제 생성 WebSocket.

#### `app/api/v1/chat.py`
*   **역할**: 대화 세션 관리 및 실시간 채팅 API.
*   **Java 비유**: `ChatController.java`
*   **상세**:
    *   `POST /sessions`: 새 대화 세션 시작.
    *   `GET /sessions`: 내 대화 목록 조회.
    *   `GET /sessions/{session_id}`: 대화 상세 조회.
    *   `PUT /sessions/{session_id}/sync`: 게스트 세션 계정 연동.
    *   `WS /ws/chat/{session_id}`: (회원용) 실시간 대화 WebSocket.
    *   `WS /ws/guest-chat/{session_id}`: (게스트용) 실시간 대화 WebSocket.
    *   `GET /hints/{session_id}`: 대화 힌트 생성.

#### `app/api/v1/analytics.py`
*   **역할**: 학습 통계 및 분석 API.
*   **Java 비유**: `AnalyticsController.java`
*   **상세**:
    *   `GET /user/me`: 내 학습 통계 조회.
    *   `GET /scenario/{scenario_id}`: 시나리오별 커뮤니티 통계 조회.

#### `app/api/v1/feedback.py`
*   **역할**: 대화 피드백 생성 API.
*   **Java 비유**: `FeedbackController.java`
*   **상세**:
    *   `POST /{session_id}`: 특정 세션에 대한 AI 피드백 생성 요청.

---

## 🚀 시작하기 (Getting Started)

1.  **설치**: `poetry install` (라이브러리 다운로드)
2.  **실행**: `poetry run uvicorn app.main:app --reload` (서버 시작)
3.  **문서**: `http://localhost:8000/docs` 접속 (Swagger UI 자동 생성)
