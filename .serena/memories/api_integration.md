# API 연동 가이드

## REST API 엔드포인트

### Base URL
- **개발**: http://49.50.137.35:8080
- **로컬**: http://localhost:8080

### 인증 헤더
```typescript
headers: {
  'Authorization': `Bearer ${access_token}`
}
```

### 주요 엔드포인트
- `POST /api/v1/auth/signup` - 회원가입
- `POST /api/v1/auth/login` - 로그인 (JWT 토큰 발급)
- `GET /api/v1/users/me` - 현재 사용자 정보 (인증 필요)
- `GET /api/v1/chat/sessions` - 대화 세션 목록 (인증 필요)
- `GET /api/v1/chat/hints/{session_id}` - 대화 힌트 생성

## WebSocket API

### 연결 URL
**로그인 사용자**:
```
ws://49.50.137.35:8080/api/v1/ws/scenario?token={access_token}
```

**게스트**:
```
ws://49.50.137.35:8080/api/v1/ws/guest-scenario
```

### 메시지 스펙

#### Client → Server
```typescript
// 오디오 전송
{
  type: "input_audio_chunk",
  audio: "<base64 pcm16>",
  sample_rate: 16000
}

// 텍스트 전송 (테스트용)
{
  type: "text",
  text: "I am at a cafe..."
}
```

#### Server → Client
```typescript
// 연결 준비
{ type: "ready" }

// TTS 오디오 스트리밍
{
  type: "response.audio.delta",
  delta: "<base64 pcm16>",
  sample_rate: 24000
}

// 사용자 STT 텍스트
{
  type: "input_audio.transcript",
  transcript: "..."
}

// 시나리오 완료
{
  type: "scenario.completed",
  json: {
    place,
    conversation_partner,
    conversation_goal
  },
  completed: true
}

// 에러
{
  type: "error",
  message: "..."
}
```

## React Query 패턴
```typescript
// API 훅 예시 (features/*/api/)
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials) => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      return response.json();
    }
  });
};
```
