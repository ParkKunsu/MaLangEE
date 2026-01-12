# MaLangEE Backend API Documentation

> **Base URL**: `http://49.50.137.35:8080`
> **API Version**: 1.0.0
> **OpenAPI**: 3.1.0
> **Last Updated**: 2026-01-12

---

## 📋 목차

- [개요](#개요)
- [인증 방식](#인증-방식)
- [API 엔드포인트](#api-엔드포인트)
  - [Auth (인증)](#auth-인증)
  - [Users (사용자)](#users-사용자)
  - [Chat (대화)](#chat-대화)
- [데이터 스키마](#데이터-스키마)
- [에러 처리](#에러-처리)
- [사용 예시](#사용-예시)

---

## 개요

MaLangEE Backend는 영어 회화 학습을 위한 RESTful API입니다.

### 주요 기능
- ✅ **사용자 인증**: JWT 기반 OAuth2 인증
- 💬 **대화 세션 관리**: 시나리오 기반 영어 회화 세션
- 🎯 **힌트 생성**: LLM 기반 실시간 대화 힌트 제공
- 👤 **사용자 관리**: 회원가입, 정보 수정, 탈퇴
- 🔄 **게스트 연동**: 비로그인 사용자 → 회원 전환 지원

---

## 인증 방식

### OAuth2 Password Bearer

인증이 필요한 모든 API는 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다.

```http
Authorization: Bearer <access_token>
```

**토큰 발급 엔드포인트**: `POST /api/v1/auth/login`

### 인증 흐름

```
1. 회원가입: POST /api/v1/auth/signup
2. 로그인: POST /api/v1/auth/login → access_token 발급
3. 인증 API 호출: Authorization: Bearer <access_token>
```

---

## API 엔드포인트

### Auth (인증)

#### 1. 회원가입

새로운 사용자를 등록합니다.

```http
POST /api/v1/auth/signup
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `login_id` | string | ✅ | 로그인 ID (고유값) |
| `nickname` | string | ✅ | 닉네임 |
| `password` | string | ✅ | 비밀번호 |
| `is_active` | boolean | ❌ | 활성 상태 (기본값: `true`) |

**Request Example**

```json
{
  "login_id": "user123",
  "nickname": "영어왕",
  "password": "securePassword123!",
  "is_active": true
}
```

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "user123",
  "nickname": "영어왕",
  "is_active": true,
  "created_at": "2026-01-12T12:00:00.000Z",
  "updated_at": "2026-01-12T12:00:00.000Z"
}
```

---

#### 2. 로그인

사용자 인증 후 JWT 토큰을 발급합니다.

```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | ✅ | 로그인 ID |
| `password` | string | ✅ | 비밀번호 |
| `grant_type` | string | ❌ | "password" (OAuth2 표준) |
| `scope` | string | ❌ | OAuth2 scope (기본값: "") |
| `client_id` | string | ❌ | OAuth2 client ID |
| `client_secret` | string | ❌ | OAuth2 client secret |

**Request Example**

```bash
username=user123&password=securePassword123!&grant_type=password
```

**Response** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNjQwOTk1MjAwfQ.signature",
  "token_type": "bearer"
}
```

---

#### 3. 로그인 ID 중복 확인

회원가입 전 로그인 ID 사용 가능 여부를 확인합니다.

```http
POST /api/v1/auth/check-login-id
Content-Type: application/json
```

**Request Body**

```json
{
  "login_id": "user123"
}
```

**Response** `200 OK`

```json
{
  "is_available": false
}
```

| Value | Description |
|-------|-------------|
| `true` | 사용 가능한 ID |
| `false` | 이미 사용 중인 ID |

---

#### 4. 닉네임 중복 확인

닉네임 사용 가능 여부를 확인합니다.

```http
POST /api/v1/auth/check-nickname
Content-Type: application/json
```

**Request Body**

```json
{
  "nickname": "영어왕"
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

> 🔐 **모든 Users API는 인증이 필요합니다.**

#### 1. 현재 사용자 정보 조회

로그인한 사용자의 정보를 조회합니다.

```http
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "user123",
  "nickname": "영어왕",
  "is_active": true,
  "created_at": "2026-01-12T12:00:00.000Z",
  "updated_at": "2026-01-12T12:00:00.000Z"
}
```

---

#### 2. 내 정보 수정

사용자 정보를 수정합니다.

```http
PUT /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nickname` | string | ❌ | 새 닉네임 |
| `password` | string | ❌ | 새 비밀번호 |

> 💡 변경하고 싶은 필드만 포함하세요.

**Request Example**

```json
{
  "nickname": "영어마스터",
  "password": "newSecurePassword456!"
}
```

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "user123",
  "nickname": "영어마스터",
  "is_active": true,
  "created_at": "2026-01-12T12:00:00.000Z",
  "updated_at": "2026-01-12T14:30:00.000Z"
}
```

---

#### 3. 회원 탈퇴 (Soft Delete)

사용자를 비활성화합니다.

```http
DELETE /api/v1/users/me
Authorization: Bearer <access_token>
```

> ⚠️ **주의사항**
> - 실제 데이터를 삭제하지 않고 `is_active`를 `false`로 변경합니다.
> - 탈퇴 후에는 로그인이 불가능합니다.
> - 데이터는 서버에 보관되며 복구 가능합니다.

**Response** `200 OK`

```json
{
  "id": 1,
  "login_id": "user123",
  "nickname": "영어마스터",
  "is_active": false,
  "created_at": "2026-01-12T12:00:00.000Z",
  "updated_at": "2026-01-12T15:00:00.000Z"
}
```

---

### Chat (대화)

#### 1. 대화 세션 목록 조회

사용자의 대화 세션 목록을 조회합니다.

```http
GET /api/v1/chat/sessions?skip=0&limit=20
Authorization: Bearer <access_token>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | integer | `0` | 건너뛸 세션 개수 (페이징) |
| `limit` | integer | `20` | 조회할 세션 개수 (최대) |

**Response** `200 OK`

```json
[
  {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Ordering at a Cafe",
    "started_at": "2026-01-12T10:00:00.000Z",
    "ended_at": "2026-01-12T10:15:30.000Z",
    "total_duration_sec": 930.5,
    "user_speech_duration_sec": 245.3,
    "message_count": 12,
    "created_at": "2026-01-12T10:00:00.000Z",
    "updated_at": "2026-01-12T10:15:30.000Z"
  },
  {
    "session_id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Job Interview Practice",
    "started_at": "2026-01-11T14:00:00.000Z",
    "ended_at": "2026-01-11T14:20:15.000Z",
    "total_duration_sec": 1215.0,
    "user_speech_duration_sec": 380.2,
    "message_count": 18,
    "created_at": "2026-01-11T14:00:00.000Z",
    "updated_at": "2026-01-11T14:20:15.000Z"
  }
]
```

---

#### 2. 대화 세션 상세 조회

특정 대화 세션의 메시지를 포함한 상세 정보를 조회합니다.

```http
GET /api/v1/chat/sessions/{session_id}
Authorization: Bearer <access_token>
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string (UUID) | 조회할 세션 ID |

**Response** `200 OK`

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Ordering at a Cafe",
  "started_at": "2026-01-12T10:00:00.000Z",
  "ended_at": "2026-01-12T10:15:30.000Z",
  "total_duration_sec": 930.5,
  "user_speech_duration_sec": 245.3,
  "messages": [
    {
      "role": "assistant",
      "content": "Hi! Welcome to Cafe MaLang. What can I get for you today?",
      "timestamp": "2026-01-12T10:00:05.000Z",
      "duration_sec": 3.2
    },
    {
      "role": "user",
      "content": "Hi, I'd like a medium latte, please.",
      "timestamp": "2026-01-12T10:00:15.000Z",
      "duration_sec": 2.8
    },
    {
      "role": "assistant",
      "content": "Sure! Would you like that hot or iced?",
      "timestamp": "2026-01-12T10:00:20.000Z",
      "duration_sec": 2.1
    }
  ],
  "scenario_place": "cafe",
  "scenario_partner": "barista",
  "scenario_goal": "order a coffee and pastry",
  "scenario_state_json": {
    "items_ordered": ["latte"],
    "payment_completed": false
  },
  "scenario_completed_at": "2026-01-12T10:15:30.000Z",
  "voice": "alloy",
  "show_text": true,
  "deleted": false,
  "created_at": "2026-01-12T10:00:00.000Z",
  "updated_at": "2026-01-12T10:15:30.000Z"
}
```

**Response Fields 설명**

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | 세션 고유 ID |
| `title` | string \| null | 세션 제목 |
| `started_at` | string | 세션 시작 시각 (ISO 8601) |
| `ended_at` | string | 세션 종료 시각 (ISO 8601) |
| `total_duration_sec` | number | 전체 대화 시간 (초) |
| `user_speech_duration_sec` | number | 사용자 발화 시간 (초) |
| `messages` | array | 대화 메시지 목록 |
| `scenario_place` | string \| null | 시나리오 장소 (예: "cafe", "airport") |
| `scenario_partner` | string \| null | 대화 상대 역할 (예: "barista", "receptionist") |
| `scenario_goal` | string \| null | 시나리오 목표 |
| `scenario_state_json` | object \| null | 시나리오 진행 상태 (JSON) |
| `scenario_completed_at` | string \| null | 시나리오 완료 시각 |
| `voice` | string \| null | 사용된 음성 프로필 (예: "alloy", "echo") |
| `show_text` | boolean \| null | 텍스트 표시 여부 |
| `deleted` | boolean \| null | 삭제 여부 |

---

#### 3. 게스트 세션 사용자 연동

게스트(비로그인)로 진행한 세션을 회원 계정에 연동합니다.

```http
PUT /api/v1/chat/sessions/{session_id}/sync
Authorization: Bearer <access_token>
```

> 💡 **사용 시나리오**
> 1. 사용자가 비로그인 상태에서 체험 대화 진행
> 2. 마음에 들어서 회원가입/로그인
> 3. 이 API를 호출하여 체험 세션을 자신의 계정으로 이동

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string (UUID) | 연동할 게스트 세션 ID |

**동작 방식**
- WebSocket 연결 종료 시 데이터는 서버에서 자동 저장됩니다.
- 이 엔드포인트는 **사용자 ID 매핑(Map User ID)** 용도입니다.
- 입력받은 `session_id`의 `user_id`를 현재 로그인한 사용자로 업데이트합니다.

**Response** `200 OK`

```json
{
  "status": "success",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

#### 4. 가장 최근 대화 세션 조회

사용자의 가장 최근 대화 세션을 조회합니다.

```http
GET /api/v1/chat/recent
Authorization: Bearer <access_token>
```

**Response** `200 OK`

세션이 존재하는 경우:

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Ordering at a Cafe",
  "started_at": "2026-01-12T10:00:00.000Z",
  "ended_at": "2026-01-12T10:15:30.000Z",
  "total_duration_sec": 930.5,
  "user_speech_duration_sec": 245.3,
  "messages": [...],
  "scenario_place": "cafe",
  "scenario_partner": "barista",
  "scenario_goal": "order a coffee and pastry",
  "voice": "alloy",
  "show_text": true
}
```

세션이 없는 경우:

```json
null
```

---

#### 5. 대화 힌트 생성

현재 대화 맥락에 맞는 추천 답변을 LLM으로 생성합니다.

```http
GET /api/v1/chat/hints/{session_id}
```

> 🔓 **인증 불필요** - 게스트 사용자도 힌트를 사용할 수 있습니다.

**사용 시나리오**
- 사용자가 5초 이상 응답하지 않을 때 프론트엔드에서 호출
- LLM이 현재 대화 맥락을 분석하여 3개의 추천 답변 생성
- 사용자가 힌트를 클릭하면 해당 문장을 음성으로 발화

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string (UUID) | 현재 진행 중인 세션 ID |

**Response** `200 OK`

```json
{
  "hints": [
    "I'd like a medium latte, please.",
    "Can I get an iced americano?",
    "What do you recommend for breakfast?"
  ],
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 데이터 스키마

### User

사용자 정보

```typescript
interface User {
  id: number;                    // 사용자 고유 ID
  login_id: string;              // 로그인 ID (고유값)
  nickname?: string | null;      // 닉네임
  is_active?: boolean;           // 활성 상태 (기본값: true)
  created_at?: string;           // 생성 시각 (ISO 8601)
  updated_at?: string;           // 수정 시각 (ISO 8601)
}
```

---

### UserCreate

회원가입 요청

```typescript
interface UserCreate {
  login_id: string;              // 로그인 ID
  nickname: string;              // 닉네임
  password: string;              // 비밀번호
  is_active?: boolean;           // 활성 상태 (기본값: true)
}
```

---

### UserUpdate

사용자 정보 수정 요청

```typescript
interface UserUpdate {
  nickname?: string | null;      // 새 닉네임
  password?: string | null;      // 새 비밀번호
}
```

---

### Token

JWT 토큰

```typescript
interface Token {
  access_token: string;          // JWT 액세스 토큰
  token_type: string;            // "bearer"
}
```

---

### SessionResponse

대화 세션 상세 정보

```typescript
interface SessionResponse {
  session_id: string;                        // 세션 고유 ID (UUID)
  title?: string | null;                     // 세션 제목
  started_at: string;                        // 시작 시각 (ISO 8601)
  ended_at: string;                          // 종료 시각 (ISO 8601)
  total_duration_sec: number;                // 전체 대화 시간 (초)
  user_speech_duration_sec: number;          // 사용자 발화 시간 (초)
  messages: MessageSchema[];                 // 대화 메시지 목록
  scenario_place?: string | null;            // 시나리오 장소
  scenario_partner?: string | null;          // 대화 상대 역할
  scenario_goal?: string | null;             // 시나리오 목표
  scenario_state_json?: Record<string, any> | null;  // 시나리오 진행 상태
  scenario_completed_at?: string | null;     // 시나리오 완료 시각
  voice?: string | null;                     // 음성 프로필 (예: "alloy", "echo")
  show_text?: boolean | null;                // 텍스트 표시 여부
  deleted?: boolean | null;                  // 삭제 여부
  created_at?: string;                       // 생성 시각 (ISO 8601)
  updated_at?: string;                       // 수정 시각 (ISO 8601)
}
```

---

### SessionSummary

대화 세션 요약 정보 (메시지 미포함)

```typescript
interface SessionSummary {
  session_id: string;                 // 세션 고유 ID (UUID)
  title?: string | null;              // 세션 제목
  started_at: string;                 // 시작 시각 (ISO 8601)
  ended_at: string;                   // 종료 시각 (ISO 8601)
  total_duration_sec: number;         // 전체 대화 시간 (초)
  user_speech_duration_sec: number;   // 사용자 발화 시간 (초)
  message_count: number;              // 메시지 개수
  created_at?: string;                // 생성 시각 (ISO 8601)
  updated_at?: string;                // 수정 시각 (ISO 8601)
}
```

---

### MessageSchema

대화 메시지

```typescript
interface MessageSchema {
  role: string;           // "user" | "assistant"
  content: string;        // 메시지 내용
  timestamp: string;      // 발화 시각 (ISO 8601)
  duration_sec: number;   // 발화 시간 (초, 기본값: 0.0)
}
```

---

### HintResponse

힌트 생성 응답

```typescript
interface HintResponse {
  hints: string[];        // 추천 답변 목록 (3개)
  session_id: string;     // 세션 ID
}
```

---

### SyncSessionResponse

세션 동기화 응답

```typescript
interface SyncSessionResponse {
  status: string;         // "success"
  session_id: string;     // 동기화된 세션 ID
}
```

---

### CheckAvailabilityResponse

중복 확인 응답

```typescript
interface CheckAvailabilityResponse {
  is_available: boolean;  // true: 사용 가능, false: 이미 사용 중
}
```

---

### HTTPValidationError

유효성 검증 오류

```typescript
interface HTTPValidationError {
  detail: ValidationError[];
}

interface ValidationError {
  loc: (string | number)[];   // 오류 위치 (예: ["body", "login_id"])
  msg: string;                // 오류 메시지
  type: string;               // 오류 타입 (예: "value_error.missing")
}
```

---

## 에러 처리

### 422 Validation Error

요청 데이터가 유효하지 않을 때 반환됩니다.

**예시: 필수 필드 누락**

```json
{
  "detail": [
    {
      "loc": ["body", "login_id"],
      "msg": "field required",
      "type": "value_error.missing"
    },
    {
      "loc": ["body", "password"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**예시: 타입 불일치**

```json
{
  "detail": [
    {
      "loc": ["query", "skip"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
}
```

---

### 401 Unauthorized

인증이 필요한 API에 토큰 없이 접근하거나 유효하지 않은 토큰을 사용할 때 반환됩니다.

```json
{
  "detail": "Not authenticated"
}
```

**발생 상황**
- `Authorization` 헤더가 없는 경우
- 토큰이 만료된 경우
- 토큰 형식이 잘못된 경우
- 토큰 서명이 유효하지 않은 경우

---

### 404 Not Found

요청한 리소스를 찾을 수 없을 때 반환됩니다.

```json
{
  "detail": "Not Found"
}
```

---

## 사용 예시

### cURL

#### 회원가입

```bash
curl -X POST "http://49.50.137.35:8080/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "user123",
    "nickname": "영어왕",
    "password": "securePassword123!"
  }'
```

#### 로그인

```bash
curl -X POST "http://49.50.137.35:8080/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user123&password=securePassword123!&grant_type=password"
```

#### 내 정보 조회

```bash
curl -X GET "http://49.50.137.35:8080/api/v1/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 대화 세션 목록 조회

```bash
curl -X GET "http://49.50.137.35:8080/api/v1/chat/sessions?skip=0&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 대화 세션 상세 조회

```bash
curl -X GET "http://49.50.137.35:8080/api/v1/chat/sessions/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 게스트 세션 연동

```bash
curl -X PUT "http://49.50.137.35:8080/api/v1/chat/sessions/550e8400-e29b-41d4-a716-446655440000/sync" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 힌트 생성

```bash
curl -X GET "http://49.50.137.35:8080/api/v1/chat/hints/550e8400-e29b-41d4-a716-446655440000"
```

---

### JavaScript (fetch)

#### 로그인 후 인증 API 호출

```javascript
// 1. 로그인
const loginResponse = await fetch('http://49.50.137.35:8080/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'user123',
    password: 'securePassword123!',
    grant_type: 'password',
  }),
});

const { access_token, token_type } = await loginResponse.json();

// 2. 토큰을 사용하여 인증 API 호출
const userResponse = await fetch('http://49.50.137.35:8080/api/v1/users/me', {
  headers: {
    'Authorization': `${token_type} ${access_token}`,
  },
});

const user = await userResponse.json();
console.log('사용자 정보:', user);
```

#### 대화 세션 목록 조회 (페이지네이션)

```javascript
const getSessionList = async (page = 0, pageSize = 20) => {
  const skip = page * pageSize;
  const response = await fetch(
    `http://49.50.137.35:8080/api/v1/chat/sessions?skip=${skip}&limit=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  return await response.json();
};

// 첫 페이지 조회
const sessions = await getSessionList(0, 10);
```

#### 힌트 생성 (게스트도 가능)

```javascript
const getHints = async (sessionId) => {
  const response = await fetch(
    `http://49.50.137.35:8080/api/v1/chat/hints/${sessionId}`
  );

  if (!response.ok) {
    throw new Error('힌트 생성 실패');
  }

  const { hints } = await response.json();
  return hints;
};

// 사용 예시
const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const hints = await getHints(sessionId);
console.log('추천 답변:', hints);
// ["I'd like a latte, please.", "Can I get an iced coffee?", ...]
```

#### 게스트 세션 연동

```javascript
const syncGuestSession = async (sessionId, accessToken) => {
  const response = await fetch(
    `http://49.50.137.35:8080/api/v1/chat/sessions/${sessionId}/sync`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('세션 연동 실패');
  }

  return await response.json();
};

// 사용 시나리오: 비로그인으로 체험 → 회원가입 → 세션 연동
const guestSessionId = localStorage.getItem('guestSessionId');
if (guestSessionId && accessToken) {
  const result = await syncGuestSession(guestSessionId, accessToken);
  console.log('세션 연동 완료:', result.status);
  localStorage.removeItem('guestSessionId');
}
```

---

### TypeScript (axios)

#### API Client 설정

```typescript
import axios, { AxiosInstance } from 'axios';

class MaLangEEClient {
  private client: AxiosInstance;
  private accessToken?: string;

  constructor(baseURL: string = 'http://49.50.137.35:8080') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });

    // 요청 인터셉터: 자동으로 토큰 추가
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  // 로그인
  async login(loginId: string, password: string): Promise<string> {
    const params = new URLSearchParams({
      username: loginId,
      password,
      grant_type: 'password',
    });

    const response = await this.client.post<Token>('/api/v1/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  // 회원가입
  async signup(userData: UserCreate): Promise<User> {
    const response = await this.client.post<User>('/api/v1/auth/signup', userData);
    return response.data;
  }

  // 내 정보 조회
  async getMyProfile(): Promise<User> {
    const response = await this.client.get<User>('/api/v1/users/me');
    return response.data;
  }

  // 대화 세션 목록 조회
  async getSessionList(skip = 0, limit = 20): Promise<SessionSummary[]> {
    const response = await this.client.get<SessionSummary[]>('/api/v1/chat/sessions', {
      params: { skip, limit },
    });
    return response.data;
  }

  // 대화 세션 상세 조회
  async getSessionDetail(sessionId: string): Promise<SessionResponse> {
    const response = await this.client.get<SessionResponse>(
      `/api/v1/chat/sessions/${sessionId}`
    );
    return response.data;
  }

  // 최근 세션 조회
  async getRecentSession(): Promise<SessionResponse | null> {
    const response = await this.client.get<SessionResponse | null>('/api/v1/chat/recent');
    return response.data;
  }

  // 힌트 생성 (인증 불필요)
  async getHints(sessionId: string): Promise<string[]> {
    const response = await this.client.get<HintResponse>(
      `/api/v1/chat/hints/${sessionId}`
    );
    return response.data.hints;
  }

  // 게스트 세션 연동
  async syncGuestSession(sessionId: string): Promise<SyncSessionResponse> {
    const response = await this.client.put<SyncSessionResponse>(
      `/api/v1/chat/sessions/${sessionId}/sync`
    );
    return response.data;
  }
}

// 사용 예시
const client = new MaLangEEClient();

// 로그인
await client.login('user123', 'securePassword123!');

// 내 정보 조회
const user = await client.getMyProfile();
console.log(user);

// 대화 세션 목록 조회
const sessions = await client.getSessionList(0, 10);
console.log(sessions);
```

---

## 추가 정보

### WebSocket API

실시간 대화 기능을 위해서는 WebSocket API를 사용합니다.
자세한 내용은 별도 문서를 참조하세요: [real_time_conversation_ws_guide.md](./real_time_conversation_ws_guide.md)

### 음성 프로필

`SessionResponse`의 `voice` 필드는 OpenAI TTS 음성 프로필을 나타냅니다.

지원 음성:
- `alloy` - 균형잡힌 중성 음성
- `echo` - 남성 음성
- `fable` - 영국식 남성 음성
- `onyx` - 깊은 남성 음성
- `nova` - 여성 음성
- `shimmer` - 부드러운 여성 음성

### 시나리오 시스템

`SessionResponse`의 시나리오 관련 필드:
- `scenario_place`: 대화 장소 (예: "cafe", "airport", "hospital")
- `scenario_partner`: 대화 상대 역할 (예: "barista", "receptionist", "doctor")
- `scenario_goal`: 대화 목표 (예: "order a coffee", "check in for flight")
- `scenario_state_json`: 시나리오 진행 상태를 저장하는 JSON 객체

### 보안 권장사항

1. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS를 사용하세요.
2. **토큰 저장**: `localStorage` 대신 `httpOnly` 쿠키 사용을 권장합니다.
3. **토큰 갱신**: 토큰 만료 시 재로그인 로직을 구현하세요.
4. **비밀번호 정책**: 최소 8자 이상, 특수문자 포함을 권장합니다.

---

**문서 작성일**: 2026-01-12
**API 버전**: 1.0.0
**문의**: MaLangEE 개발팀
