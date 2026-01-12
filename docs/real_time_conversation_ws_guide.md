# 📡 Real-time Chat WebSocket Guide (실시간 대화)

## Overview
실시간 대화(WebSocket) 연결을 위한 API 엔드포인트가 **회원용**과 **게스트용**으로 분리되었습니다.
사용자 인증 상태에 따라 적절한 엔드포인트를 사용해 주세요.

---

## 1. Endpoints

### 🟢 A. Authenticated User (회원용)
로그인한 유저가 대화 세션에 접속할 때 사용합니다.
- **URL**: `ws://{HOST}/api/v1/chat/ws/chat/{session_id}`
- **Method**: WebSocket
- **Auth**: 필수 (Query Param or Header)

### 🟡 B. Guest User (비회원/데모용)
로그인하지 않은 유저가 체험하기 대화 세션에 접속할 때 사용합니다.
- **URL**: `ws://{HOST}/api/v1/chat/ws/guest-chat/{session_id}`
- **Method**: WebSocket
- **Auth**: 없음

---

## 2. Parameters (Common)

두 엔드포인트 모두 아래의 쿼리 파라미터를 지원합니다.
파라미터 전달 시 해당 세션의 설정이 **DB에 즉시 저장**되고, 연결 시 바로 적용됩니다.

| User Param | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `voice` | `string` | Optional | AI 목소리 설정 (alloy, ash, ballad, coral, echo, sage, shimmer, verse) | `?voice=shimmer` |
| `show_text` | `boolean` | Optional | 자막 표시 여부 | `?show_text=true` |

*(참고: 파라미터를 생략하면 기존에 저장된 설정을 사용하거나 시스템 기본값(alloy)으로 동작합니다.)*

---

## 3. Usage Examples

### Case 1: 로그인 유저가 'shimmer' 목소리로 접속 시
```javascript
// Token은 쿼리 파라미터로 전달
const socket = new WebSocket(
  `ws://api.malangee.com/api/v1/chat/ws/chat/SESSION_123?token=${accessToken}&voice=shimmer&show_text=true`
);
```

### Case 2: 게스트 유저가 'alloy' 목소리로 접속 시
```javascript
// 인증 토큰 없음, 게스트 전용 엔드포인트 사용
const socket = new WebSocket(
  `ws://api.malangee.com/api/v1/chat/ws/guest-chat/SESSION_999?voice=alloy`
);
```

### Case 3: 기존 설정 그대로 접속 (파라미터 생략)
```javascript
const socket = new WebSocket(
  `ws://api.malangee.com/api/v1/chat/ws/chat/SESSION_123?token=${accessToken}`
);
```

---

## 4. Error Codes

연결 실패 시 다음과 같은 WebSocket Close Code가 반환될 수 있습니다.

| Code | Reason | Description |
| :--- | :--- | :--- |
| `1008` | Policy Violation | 토큰 인증 실패 (회원용 엔드포인트) |
| `4003` | Unauthorized | **권한 없음**: 이미 주인이 있는 세션에 다른 유저(또는 게스트)가 접근하려 함 |
| `4004` | Session Not Found | **세션 없음**: 존재하지 않는 세션 ID로 연결 시도 (연결 거부) |
| `1011` | Server Error | 서버 내부 오류 |

> **주의**: 게스트용 엔드포인트라도, 이미 특정 유저에게 귀속된(User ID가 있는) 세션 ID로 접근하면 `4003` 에러와 함께 연결이 차단됩니다.

---

## 5. Message Types

WebSocket 연결 후 클라이언트와 서버가 주고받는 메시지(JSON) 형식입니다.

### 📤 Client -> Server (송신)

#### 1. 오디오 데이터 전송 (`input_audio_buffer.append`)
마이크에서 캡처한 오디오청크(PCM16, Base64 Encoded)를 전송합니다.
```json
{
  "type": "input_audio_buffer.append",
  "audio": "BASE64_ENCODED_PCM16_DATA"
}
```

#### 2. 발화 종료 (`input_audio_buffer.commit`)
(VAD를 사용하지 않는 경우) 수동으로 발화가 끝났음을 알립니다.
```json
{
  "type": "input_audio_buffer.commit"
}
```

#### 3. 응답 생성 요청 (`response.create`)
강제로 AI의 응답 생성을 트리거합니다.
```json
{
  "type": "response.create"
}
```

#### 4. 세션 설정 변경 (`session.update`)
대화 도중 설정을 변경합니다. (예: 목소리 변경)
```json
{
  "type": "session.update",
  "config": {
    "voice": "shimmer"
  }
}
```

#### 5. 연결 종료 (`disconnect`)
대화를 정상적으로 종료합니다. 서버는 세션 리포트를 반환하고 소켓을 닫습니다.
```json
{
  "type": "disconnect"
}
```

---

### 📥 Server -> Client (수신)

#### 1. AI 오디오 스트림 (`audio.delta`)
AI의 음성 데이터 청크입니다. 즉시 재생해야 합니다.
```json
{
  "type": "audio.delta",
  "delta": "BASE64_ENCODED_PCM16_DATA"
}
```

#### 2. AI 오디오 스트림 완료 (`audio.done`)
AI의 음성 전송이 완료되었음을 알립니다. (재생 버퍼 관리용)
```json
{
  "type": "audio.done"
}
```

#### 3. 사용자 발화 시작 감지 (`speech.started`)
서버측 VAD가 사용자의 목소리를 감지했습니다. (UI에서 듣기 모드로 전환 등)
```json
{
  "type": "speech.started"
}
```

#### 4. 사용자 발화 종료 감지 (`speech.stopped`)
사용자의 발화가 끝났음을 감지했습니다. (AI 응답 대기 상태 전환 등)
```json
{
  "type": "speech.stopped"
}
```

#### 5. 사용자 자막 (`user.transcript`)
사용자 발화의 음성 인식 결과입니다.
```json
{
  "type": "user.transcript",
  "transcript": "Hello, how are you?"
}
```

#### 6. AI 자막 (`transcript.done`)
AI 발화의 텍스트가 완성되었습니다.
```json
{
  "type": "transcript.done",
  "transcript": "I'm doing great, thank you! How can I help you today?"
}
```

#### 7. 에러 (`error`)
오류가 발생했습니다. 메시지 내용을 사용자에게 보여줄 수 있습니다.
```json
{
  "type": "error",
  "code": "server_error",
  "message": "Detailed error message"
}
```

#### 8. 세션 종료 및 리포트 (`disconnected`)
세션이 종료되었으며, 대화 요약 리포트가 포함됩니다.
```json
{
  "type": "disconnected",
  "reason": "Session ended",
  "report": {
    "session_id": "SESSION_123",
    "total_duration_sec": 120,
    "user_speech_duration_sec": 45,
    "messages": [...] 
  }
}
```

---

## 6. Voice Options

현재 지원되는 AI 목소리 목록입니다. 실시간 대화 중 언제든지 변경할 수 있습니다.

### 🎙️ Available Voices
*   `alloy` (Default)
*   `ash`
*   `ballad`
*   `coral`
*   `echo`
*   `sage`
*   `shimmer`
*   `verse`

### 📝 Usage Examples

**1. 연결 시 설정 (URL Parameter)**
```javascript
// 'coral' 목소리로 시작
const socket = new WebSocket(
  "ws://api.malangee.com/api/v1/chat/ws/chat/SESSION_123?voice=coral"
);
```

**2. 대화 중 변경 (Session Update)**
```javascript
// 대화 도중 'sage'로 변경 요청
socket.send(JSON.stringify({
  type: "session.update",
  config: {
    voice: "sage"
  }
}));
```
