# 📡 Real-time Chat WebSocket Guide (실시간 대화)

## Overview
실시간 대화(WebSocket) 연결을 위한 API 엔드포인트가 **회원용**과 **게스트용**으로 분리되었습니다.
사용자 인증 상태에 따라 적절한 엔드포인트를 사용해 주세요.

---

## 1. Endpoints

### 🟢 A. Authenticated User (회원용)
로그인한 유저가 대화 세션에 접속할 때 사용합니다.
- **URL**: `ws://{HOST}/ws/chat/{session_id}`
- **Method**: WebSocket
- **Auth**: 필수 (Query Param or Header)

### 🟡 B. Guest User (비회원/데모용)
로그인하지 않은 유저가 체험하기 대화 세션에 접속할 때 사용합니다.
- **URL**: `ws://{HOST}/ws/guest-chat/{session_id}`
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
  `ws://api.malangee.com/ws/chat/SESSION_123?token=${accessToken}&voice=shimmer&show_text=true`
);
```

### Case 2: 게스트 유저가 'alloy' 목소리로 접속 시
```javascript
// 인증 토큰 없음, 게스트 전용 엔드포인트 사용
const socket = new WebSocket(
  `ws://api.malangee.com/ws/guest-chat/SESSION_999?voice=alloy`
);
```

### Case 3: 기존 설정 그대로 접속 (파라미터 생략)
```javascript
const socket = new WebSocket(
  `ws://api.malangee.com/ws/chat/SESSION_123?token=${accessToken}`
);
```

---

## 4. Error Codes

연결 실패 시 다음과 같은 WebSocket Close Code가 반환될 수 있습니다.

| Code | Reason | Description |
| :--- | :--- | :--- |
| `1008` | Policy Violation | 토큰 인증 실패 (회원용 엔드포인트) |
| `4003` | Unauthorized | **권한 없음**: 이미 주인이 있는 세션에 다른 유저(또는 게스트)가 접근하려 함 |
| `1011` | Server Error | 서버 내부 오류 |

> **주의**: 게스트용 엔드포인트라도, 이미 특정 유저에게 귀속된(User ID가 있는) 세션 ID로 접근하면 `4003` 에러와 함께 연결이 차단됩니다.
