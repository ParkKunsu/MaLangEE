# 🔌 MaLangEE WebSocket 통합 가이드

실시간 AI 대화 기능을 위한 WebSocket 엔드포인트와 프로토콜 명세입니다.

---

## 1. 🟡 게스트용 (Guest)
인증 없이 즉시 체험 가능한 엔드포인트입니다.

### 📍 엔드포인트
| 기능 | URL |
| :--- | :--- |
| **일반 대화** | `ws://49.50.137.35:8080/api/v1/chat/ws/guest-chat/{session_id}` |
| **시나리오** | `ws://49.50.137.35:8080/api/v1/ws/guest-scenario` |

---

## 2. 🟢 회원용 (Member)
로그인한 사용자를 위한 개인화된 엔드포인트입니다.

### 📍 엔드포인트
| 기능 | URL |
| :--- | :--- |
| **일반 대화** | `ws://49.50.137.35:8080/api/v1/chat/ws/chat/{session_id}?token={access_token}` |
| **시나리오** | `ws://49.50.137.35:8080/api/v1/ws/scenario?token={access_token}` |

---

## 3. 🔄 진행 플로우 (Flow)

실시간 대화의 표준 진행 순서입니다.

### 1단계: 연결 및 준비 (Connection)
1.  **Client**: WebSocket 연결 요청 (URL 파라미터 포함)
2.  **Server**: 연결 승인 및 세션 초기화
3.  **Server**: `ready` 메시지 송신 (대화 시작 가능 상태)

### 2단계: 사용자 발화 (User Turn)
1.  **Client**: 마이크 입력 데이터를 `input_audio_buffer.append`로 지속 송신
2.  **Server**: (VAD 감지 시) `speech.started` 송신 -> **AI 재생 중단(Barge-in)**
3.  **Server**: 사용자 발화 종료 감지 시 `speech.stopped` 송신
4.  **Server**: 음성 인식 결과인 `user.transcript` 송신 (자막 표시용)

### 3단계: AI 응답 (AI Turn)
1.  **Server**: AI 음성 데이터를 `audio.delta`로 스트리밍 송신 -> **Client 즉시 재생**
2.  **Server**: AI 답변 텍스트가 완성되면 `transcript.done` 송신
3.  **Server**: 모든 음성 데이터 전송 완료 시 `audio.done` 송신

### 4단계: 시나리오 완료 (Scenario Only)
1.  **Server**: 시나리오 조건(장소, 상대, 목표) 충족 시 `scenario.completed` 송신
2.  **Client**: 결과 데이터 저장 및 다음 단계(본 대화 등)로 전환

### 5단계: 종료 (Termination)
1.  **Client**: `disconnect` 메시지 송신 또는 소켓 Close
2.  **Server**: 최종 세션 리포트가 포함된 `disconnected` 송신 후 연결 종료

---

## 4. ⚙️ 공용 사양 (Common)

### 쿼리 파라미터 (Query Parameters)
- `voice`: AI 목소리 설정 (`alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`)
- `show_text`: 자막 표시 여부 (`true` | `false`)

### 📤 메시지 프로토콜: 송신 (Client -> Server)
| 타입 | 설명 | 데이터 구조 |
| :--- | :--- | :--- |
| `input_audio_buffer.append` | 오디오 데이터 전송 | `{ "type": "...", "audio": "<base64>" }` |
| `input_audio_buffer.commit` | 발화 종료 알림 | `{ "type": "input_audio_buffer.commit" }` |
| `response.create` | 응답 생성 요청 | `{ "type": "response.create" }` |
| `session.update` | 실시간 설정 변경 | `{ "type": "session.update", "config": { "voice": "nova" } }` |
| `text` | 텍스트 메시지 전송 | `{ "type": "text", "text": "..." }` |

### 📥 메시지 프로토콜: 수신 (Server -> Client)
| 타입 | 설명 | 결과값 형식 (JSON) |
| :--- | :--- | :--- |
| `ready` | 연결 준비 완료 | `{ "type": "ready" }` |
| `audio.delta` | AI 오디오 스트림 | `{ "type": "audio.delta", "delta": "<base64_pcm16>" }` |
| `audio.done` | AI 오디오 완료 | `{ "type": "audio.done" }` |
| `speech.started` | 사용자 발화 시작 | `{ "type": "speech.started" }` |
| `speech.stopped` | 사용자 발화 종료 | `{ "type": "speech.stopped" }` |
| `user.transcript` | 사용자 자막 | `{ "type": "user.transcript", "transcript": "..." }` |
| `transcript.done` | AI 최종 자막 | `{ "type": "transcript.done", "transcript": "..." }` |
| `scenario.completed` | 시나리오 완료 | `{ "type": "scenario.completed", "json": {...}, "completed": true }` |
| `disconnected` | 세션 종료 리포트 | `{ "type": "disconnected", "reason": "...", "report": {...} }` |

---
**최종 업데이트**: 2026-01-17
