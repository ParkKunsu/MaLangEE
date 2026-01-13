# PCM16 오디오 처리 패턴

## 개요
- **입력 포맷**: PCM16 (16kHz, mono)
- **출력 포맷**: PCM16 (24kHz, mono)
- **전송 방식**: Base64 인코딩

## 핵심 변환 함수

### Base64 → Uint8Array
```typescript
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
```

### PCM16 → Float32 (재생용)
```typescript
function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const samples = new Float32Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < samples.length; i++) {
    const lo = bytes[i * 2];
    const hi = bytes[i * 2 + 1];
    let sample = (hi << 8) | lo;
    if (sample >= 0x8000) sample -= 0x10000;
    samples[i] = sample / 32768;
  }
  return samples;
}
```

### Float32 → PCM16 (전송용)
```typescript
function float32ToPCM16(float32: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    let sample = Math.max(-1, Math.min(1, float32[i]));
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(i * 2, sample, true);
  }
  return new Uint8Array(buffer);
}
```

### Uint8Array → Base64
```typescript
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
```

## 사용 예시

### 마이크 → 서버
```typescript
// 마이크 캡처 → Float32Array
const audioData = await recordAudio();

// Float32 → PCM16
const pcm16 = float32ToPCM16(audioData);

// PCM16 → Base64
const base64 = bytesToBase64(pcm16);

// WebSocket 전송
ws.send(JSON.stringify({
  type: "input_audio_chunk",
  audio: base64,
  sample_rate: 16000
}));
```

### 서버 → 스피커
```typescript
// WebSocket 수신
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "response.audio.delta") {
    // Base64 → Uint8Array
    const bytes = base64ToBytes(data.delta);
    
    // PCM16 → Float32
    const float32 = pcm16ToFloat32(bytes);
    
    // AudioContext로 재생
    playAudio(float32, data.sample_rate);
  }
};
```

## 주의사항
- Little-endian 바이트 순서 사용
- Sample rate 주의 (입력 16kHz, 출력 24kHz)
- 버퍼 오버플로우 방지 (클리핑: -1 ~ 1)
