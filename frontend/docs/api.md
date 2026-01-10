# MaLangEE Backend API Documentation

> **Base URL**: `http://49.50.137.35:8080`
> **API Version**: 1.0.0
> **OpenAPI**: 3.1.0

---

## 목차

- [인증 방식](#인증-방식)
- [API 엔드포인트](#api-엔드포인트)
  - [Auth (인증)](#auth-인증)
  - [Users (사용자)](#users-사용자)
  - [Chat (대화)](#chat-대화)
- [스키마 정의](#스키마-정의)

---

## 인증 방식

### OAuth2 Password Bearer

모든 인증이 필요한 API는 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다.

```http
Authorization: Bearer <access_token>
```

**토큰 발급**: `POST /api/v1/auth/login`

---

## API 엔드포인트

### Auth (인증)

#### 회원가입

```http
POST /api/v1/auth/signup
```

**Request Body**

```json
{
  "login_id": "string",
  "nickname": "string",
  "password": "string",
  "is_active": true
}
```

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "string",
  "nickname": "string",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

---

#### 로그인

```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | ✅ | 로그인 ID |
| `password` | string | ✅ | 비밀번호 |
| `grant_type` | string | ❌ | "password" |
| `scope` | string | ❌ | 기본값: "" |
| `client_id` | string | ❌ | - |
| `client_secret` | string | ❌ | - |

**Response** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

#### 로그인 ID 중복 확인

```http
POST /api/v1/auth/check-login-id
```

**Request Body**

```json
{
  "login_id": "string"
}
```

**Response** `200 OK`

```json
{
  "is_available": true
}
```

---

#### 닉네임 중복 확인

```http
POST /api/v1/auth/check-nickname
```

**Request Body**

```json
{
  "nickname": "string"
}
```

**Response** `200 OK`

```json
{
  "is_available": true
}
```

---

### Users (사용자)

> 🔐 모든 Users API는 인증이 필요합니다.

#### 현재 사용자 정보 조회

```http
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "string",
  "nickname": "string",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

---

#### 내 정보 수정

```http
PUT /api/v1/users/me
Authorization: Bearer <access_token>
```

**Request Body**

```json
{
  "nickname": "string",
  "password": "string"
}
```

> 모든 필드는 선택적입니다. 변경하고 싶은 필드만 포함하세요.

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "string",
  "nickname": "updated_nickname",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

---

#### 회원 탈퇴 (Soft Delete)

```http
DELETE /api/v1/users/me
Authorization: Bearer <access_token>
```

> 실제 데이터를 삭제하지 않고, `is_active`를 `false`로 변경합니다.
> 탈퇴 후에는 로그인이 불가능합니다.

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "string",
  "nickname": "string",
  "is_active": false,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

---

### Chat (대화)

#### 대화 세션 목록 조회

```http
GET /api/v1/chat/sessions
Authorization: Bearer <access_token>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | integer | 0 | 건너뛸 개수 |
| `limit` | integer | 20 | 조회할 개수 |

**Response** `200 OK`

```json
[
  {
    "session_id": "uuid-string",
    "title": "카페에서 주문하기",
    "started_at": "2024-01-01T10:00:00",
    "ended_at": "2024-01-01T10:15:00",
    "total_duration_sec": 900.0,
    "user_speech_duration_sec": 300.0,
    "message_count": 10,
    "created_at": "2024-01-01T10:00:00",
    "updated_at": "2024-01-01T10:15:00"
  }
]
```

---

#### 대화 세션 상세 조회

```http
GET /api/v1/chat/sessions/{session_id}
Authorization: Bearer <access_token>
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | 세션 ID |

**Response** `200 OK`

```json
{
  "session_id": "uuid-string",
  "title": "카페에서 주문하기",
  "started_at": "2024-01-01T10:00:00",
  "ended_at": "2024-01-01T10:15:00",
  "total_duration_sec": 900.0,
  "user_speech_duration_sec": 300.0,
  "messages": [
    {
      "role": "assistant",
      "content": "Hi! Welcome to the cafe. What can I get for you?",
      "timestamp": "2024-01-01T10:00:00",
      "duration_sec": 3.5
    },
    {
      "role": "user",
      "content": "I'd like a latte, please.",
      "timestamp": "2024-01-01T10:00:10",
      "duration_sec": 2.0
    }
  ],
  "scenario_place": "cafe",
  "scenario_partner": "barista",
  "scenario_goal": "order a coffee",
  "scenario_state_json": {},
  "scenario_completed_at": "2024-01-01T10:15:00",
  "deleted": false,
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T10:15:00"
}
```

---

#### 게스트 세션 사용자 연동

```http
PUT /api/v1/chat/sessions/{session_id}/sync
Authorization: Bearer <access_token>
```

> 게스트(비로그인) 상태에서 진행한 세션을 회원가입/로그인 후 자신의 계정에 연동합니다.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | 연동할 세션 ID |

**Response** `200 OK`

```json
{
  "status": "success",
  "session_id": "uuid-string"
}
```

---

#### 가장 최근 대화 세션 조회

```http
GET /api/v1/chat/recent
Authorization: Bearer <access_token>
```

**Response** `200 OK`

```json
{
  "session_id": "uuid-string",
  "title": "카페에서 주문하기",
  "started_at": "2024-01-01T10:00:00",
  "ended_at": "2024-01-01T10:15:00",
  "total_duration_sec": 900.0,
  "user_speech_duration_sec": 300.0,
  "messages": [...],
  "scenario_place": "cafe",
  "scenario_partner": "barista",
  "scenario_goal": "order a coffee"
}
```

> 세션이 없는 경우 `null`을 반환합니다.

---

#### 대화 힌트 생성

```http
GET /api/v1/chat/hints/{session_id}
```

> 🔓 인증 불필요 (게스트 사용자도 힌트 사용 가능)

**용도**
- 5초 이상 사용자 무응답 시 프론트엔드에서 호출
- LLM을 통해 현재 대화 맥락에 맞는 추천 답변 3개 생성

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | 현재 진행 중인 세션 ID |

**Response** `200 OK`

```json
{
  "hints": [
    "I'd like a medium latte, please.",
    "Can I get an iced americano?",
    "What do you recommend?"
  ],
  "session_id": "uuid-string"
}
```

---

## 스키마 정의

### User

```typescript
interface User {
  id: number;
  login_id: string;
  nickname?: string | null;
  is_active?: boolean;  // default: true
  created_at?: string;  // ISO 8601 datetime
  updated_at?: string;  // ISO 8601 datetime
}
```

### UserCreate

```typescript
interface UserCreate {
  login_id: string;
  nickname: string;
  password: string;
  is_active?: boolean;  // default: true
}
```

### UserUpdate

```typescript
interface UserUpdate {
  nickname?: string | null;
  password?: string | null;
}
```

### Token

```typescript
interface Token {
  access_token: string;
  token_type: string;  // "bearer"
}
```

### SessionResponse

```typescript
interface SessionResponse {
  session_id: string;
  title?: string | null;
  started_at: string;
  ended_at: string;
  total_duration_sec: number;
  user_speech_duration_sec: number;
  messages: MessageSchema[];
  scenario_place?: string | null;
  scenario_partner?: string | null;
  scenario_goal?: string | null;
  scenario_state_json?: Record<string, any> | null;
  scenario_completed_at?: string | null;
  deleted?: boolean | null;
  created_at?: string;
  updated_at?: string;
}
```

### SessionSummary

```typescript
interface SessionSummary {
  session_id: string;
  title?: string | null;
  started_at: string;
  ended_at: string;
  total_duration_sec: number;
  user_speech_duration_sec: number;
  message_count: number;
  created_at?: string;
  updated_at?: string;
}
```

### MessageSchema

```typescript
interface MessageSchema {
  role: string;        // "user" | "assistant"
  content: string;
  timestamp: string;
  duration_sec: number;  // default: 0.0
}
```

### HintResponse

```typescript
interface HintResponse {
  hints: string[];     // 추천 답변 3개
  session_id: string;
}
```

### SyncSessionResponse

```typescript
interface SyncSessionResponse {
  status: string;      // "success"
  session_id: string;
}
```

### CheckAvailabilityResponse

```typescript
interface CheckAvailabilityResponse {
  is_available: boolean;
}
```

### HTTPValidationError

```typescript
interface HTTPValidationError {
  detail: ValidationError[];
}

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
```

---

## 에러 응답

### 422 Validation Error

요청 데이터가 유효하지 않을 때 반환됩니다.

```json
{
  "detail": [
    {
      "loc": ["body", "login_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 401 Unauthorized

인증이 필요한 API에 토큰 없이 접근하거나, 유효하지 않은 토큰을 사용할 때 반환됩니다.

---

## 사용 예시

### cURL

```bash
# 회원가입
curl -X POST "http://49.50.137.35:8080/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"login_id": "testuser", "nickname": "테스트", "password": "password123"}'

# 로그인
curl -X POST "http://49.50.137.35:8080/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=password123"

# 내 정보 조회
curl -X GET "http://49.50.137.35:8080/api/v1/users/me" \
  -H "Authorization: Bearer <access_token>"

# 대화 세션 목록 조회
curl -X GET "http://49.50.137.35:8080/api/v1/chat/sessions?skip=0&limit=10" \
  -H "Authorization: Bearer <access_token>"

# 힌트 생성
curl -X GET "http://49.50.137.35:8080/api/v1/chat/hints/{session_id}"
```

### JavaScript (fetch)

```javascript
// 로그인
const loginResponse = await fetch('http://49.50.137.35:8080/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'testuser',
    password: 'password123',
  }),
});

const { access_token } = await loginResponse.json();

// 인증이 필요한 API 호출
const userResponse = await fetch('http://49.50.137.35:8080/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
  },
});

const user = await userResponse.json();
```
