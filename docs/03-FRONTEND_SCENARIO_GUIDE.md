# MaLangEE Scenario 모듈 프런트엔드 가이드 (React)

이 문서는 `/ai-engine/scenario` 모듈을 FastAPI WebSocket으로 노출한 엔드포인트에 React 프런트엔드를 연결하는 방법을 정리한다. 목표는 음성 입력 → STT → 시나리오 구성 → TTS 응답 → `scenario.completed`까지의 흐름을 UI에서 안정적으로 다루는 것이다.

## 1) 모듈 역할 요약
- 시나리오 구성 조건: 장소(place), 대화 상대(partner), 대화 목적(goal) 3가지 확보.
- 최대 3회까지 보완 질문 후, 부족하면 fallback 추정으로 완료.
- 완료 시 `scenario.completed` 이벤트를 1회 전송하고 이후 입력 무시.
- 음성 입력은 OpenAI Realtime STT로 처리, 응답은 TTS(PCM16)로 스트리밍.

관련 코드:
- 시나리오 로직: `ai-engine/scenario/scenario_builder.py`
- 이벤트 파이프라인: `ai-engine/scenario/realtime_pipeline.py`
- WS 핸들러: `ai-engine/scenario/realtime_bridge.py`
- FastAPI WS 엔드포인트: `backend/app/api/v1/scenario.py`
- 테스트 참고: `tests/index.html`

## 2) 프런트엔드 데이터 흐름
1) 브라우저 마이크 → PCM16 base64 → WS(`/api/v1/ws/scenario` 또는 `/api/v1/ws/guest-scenario`, `input_audio_chunk`)
2) 서버가 Realtime STT로 사용자 발화를 텍스트로 추출
3) 시나리오 로직이 질문/완료 문장 생성
4) 서버가 TTS(PCM16) 스트리밍 전송(`response.audio.delta`)
5) 완료 시 `scenario.completed` 전송

## 3) WebSocket 메시지 스펙

### 3.1 Client → Server
- `input_audio_chunk`
  - `{ type: "input_audio_chunk", audio: "<base64 pcm16>", sample_rate: 16000 }`
  - `sample_rate`는 마이크 입력 샘플레이트(예: 16000).
- `input_audio_commit`
  - `{ type: "input_audio_commit" }`
  - 현재 서버는 `server_vad`를 사용하므로 기본적으로 무시됨.
- `input_audio_clear`
  - `{ type: "input_audio_clear" }`
  - 버퍼 초기화 요청.
- `text`
  - `{ type: "text", text: "I am at a cafe..." }`
  - 마이크 없이 텍스트 테스트용.

### 3.2 Server → Client
- `ready`
  - `{ type: "ready" }`
  - 연결 준비 완료 시 수신. 이후 오디오 전송 권장.
- `response.audio.delta`
  - `{ type: "response.audio.delta", delta: "<base64 pcm16>", sample_rate: 24000 }`
  - TTS 스트리밍 청크.
- `response.audio.done`
  - `{ type: "response.audio.done" }`
  - 현재 응답 오디오 스트림 종료.
- `response.audio_transcript.delta`
  - `{ type: "response.audio_transcript.delta", transcript_delta: "..." }`
  - 서버가 전달하는 TTS 텍스트의 부분 스트림.
- `response.audio_transcript.done`
  - `{ type: "response.audio_transcript.done", transcript: "..." }`
  - 서버가 전달하는 TTS 텍스트의 최종 문장.
- `input_audio.transcript`
  - `{ type: "input_audio.transcript", transcript: "..." }`
  - 사용자 STT 텍스트(디버그/UX 표시용).
- `scenario.completed`
  - `{ type: "scenario.completed", json: { place, conversation_partner, conversation_goal }, completed: true }`
  - 시나리오 완료 신호. 이후 입력은 무시됨.
- `error`
  - `{ type: "error", message: "..." }`

## 4) React 구현 포인트

### 4.1 오디오 캡처 및 전송
- 브라우저 오디오는 Float32 → PCM16 변환 필요.
- 입력 샘플레이트는 16k 권장. 필요 시 다운샘플링.
- 서버가 모델 발화 중일 때 입력을 무시하므로, 프런트엔드는 응답 재생 중 마이크를 자동 중지하거나 감쇠하는 UX가 좋다.

### 4.2 PCM16 재생
- `response.audio.delta` 수신 시 base64 → PCM16 → Float32 변환 후 Web Audio API로 큐잉.
- `response.audio.done`에서 재생 스케줄을 초기화하거나 다음 입력을 허용하는 UX 상태 전환.

### 4.3 시나리오 완료 처리
- `scenario.completed` 수신 시:
  - 마이크 중지
  - UI에 완료 카드/요약 표시
  - 추가 입력 비활성화

## 5) React 예시 코드 (핵심 로직)
아래는 최소 동작 구조이다. 실제 앱에서는 에러 처리, 재연결, 상태 관리 보강을 권장한다.

```tsx
import { useEffect, useMemo, useRef, useState } from "react";

type ScenarioJson = {
  place: string | null;
  conversation_partner: string | null;
  conversation_goal: string | null;
};

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pcm16ToFloat32(bytes: Uint8Array) {
  const samples = new Float32Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < samples.length; i += 1) {
    const lo = bytes[i * 2];
    const hi = bytes[i * 2 + 1];
    let sample = (hi << 8) | lo;
    if (sample >= 0x8000) sample -= 0x10000;
    samples[i] = sample / 32768;
  }
  return samples;
}

function float32ToPCM16(float32: Float32Array) {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i += 1) {
    let sample = Math.max(-1, Math.min(1, float32[i]));
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(i * 2, sample, true);
  }
  return new Uint8Array(buffer);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function ScenarioClient({ wsUrl }: { wsUrl: string }) {
  const [connected, setConnected] = useState(false);
  const [completed, setCompleted] = useState<ScenarioJson | null>(null);
  const [transcript, setTranscript] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartRef = useRef(0);

  const ensureAudioContext = (sampleRate: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate });
      nextStartRef.current = audioContextRef.current.currentTime;
    }
  };

  const playChunk = (base64: string, sampleRate: number) => {
    ensureAudioContext(sampleRate);
    const bytes = base64ToBytes(base64);
    const float32 = pcm16ToFloat32(bytes);
    const ctx = audioContextRef.current!;
    const buffer = ctx.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const startTime = Math.max(nextStartRef.current, ctx.currentTime);
    source.start(startTime);
    nextStartRef.current = startTime + buffer.duration;
  };

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      let payload: any = null;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (payload.type === "response.audio.delta") {
        const sampleRate = Number(payload.sample_rate) || 24000;
        playChunk(payload.delta, sampleRate);
        return;
      }
      if (payload.type === "response.audio_transcript.delta") {
        setTranscript((prev) => prev + (payload.transcript_delta || ""));
        return;
      }
      if (payload.type === "response.audio_transcript.done") {
        setTranscript(payload.transcript || "");
        return;
      }
      if (payload.type === "input_audio.transcript") {
        // 사용자 STT 텍스트 표시용
        return;
      }
      if (payload.type === "scenario.completed") {
        setCompleted(payload.json || null);
      }
    };
    return () => ws.close();
  }, [wsUrl]);

  const sendPcm16Chunk = (pcm16: Uint8Array, sampleRate: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        type: "input_audio_chunk",
        audio: bytesToBase64(pcm16),
        sample_rate: sampleRate,
      }),
    );
  };

  return (
    <div>
      <div>WS: {connected ? "Connected" : "Disconnected"}</div>
      <div>Transcript: {transcript}</div>
      <div>Completed: {completed ? JSON.stringify(completed) : "-"}</div>
      {/* 마이크 캡처 로직은 별도 Hook으로 분리 권장 */}
    </div>
  );
}
```

## 6) UX 권장 사항
- “모델 응답 중 마이크 입력 차단” UX 표시 (서버가 입력을 무시함).
- `scenario.completed` 수신 시 대화 종료 안내 및 다음 단계 버튼 제공.
- STT 텍스트(`input_audio.transcript`)를 실시간 캡션으로 표시하면 대화 흐름이 안정적.

## 7) 로컬 테스트 방법
- 서버 실행:
  - `cd backend`
  - `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- 로그인 사용자: `ws://127.0.0.1:8000/api/v1/ws/scenario?token=...`
- 게스트: `ws://127.0.0.1:8000/api/v1/ws/guest-scenario`
- `tests/index.html` 기본 URL은 게스트 엔드포인트를 사용.

## 8) 주의사항
- 입력 오디오 포맷은 PCM16(LE), 모노 채널 기준.
- 응답 오디오 샘플레이트는 기본 24kHz.
- 완료 후 서버는 OpenAI WS를 닫으므로, 프런트에서는 마이크/스트림을 정리해야 한다.
