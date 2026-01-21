/**
 * WebSocket 메시지 타입 정의
 */

// ============================================================================
// 주제 정하기 (Scenario) 이벤트 타입
// ============================================================================

export type ScenarioEventType =
  | "ready"
  | "input_audio.transcript"
  | "response.audio.delta"
  | "response.audio.done"
  | "response.audio_transcript.done"
  | "scenario.completed"
  | "error";

export type ScenarioClientEventType =
  | "input_audio_chunk"
  | "input_audio_commit"
  | "input_audio_clear"
  | "text";

// ============================================================================
// 대화하기 (Chat) 이벤트 타입
// ============================================================================

export type ConversationEventType =
  | "session.created"
  | "session.updated"
  | "audio.delta"
  | "audio.done"
  | "transcript.done"
  | "user.transcript"
  | "speech.started"
  | "speech.stopped"
  | "disconnected"
  | "error";

export type ConversationClientEventType =
  | "input_audio_buffer.append"
  | "input_audio_buffer.commit"
  | "response.create"
  | "session.update"
  | "disconnect";

// ============================================================================
// 공통 메시지 인터페이스
// ============================================================================

export interface BaseWebSocketMessage {
  type: string;
  message?: string;
  error?: string;
}

// ============================================================================
// 주제 정하기 (Scenario) 메시지
// ============================================================================

export interface ScenarioMessage extends BaseWebSocketMessage {
  type: ScenarioEventType;
  transcript?: string;
  delta?: string;
  sample_rate?: number;
  json?: {
    place: string | null;
    conversation_partner: string | null;
    conversation_goal: string | null;
    sessionId?: string;
  };
  completed?: boolean;
}

// ============================================================================
// 대화하기 (Chat) 메시지
// ============================================================================

export interface SessionReport {
  session_id: string;
  total_duration_sec: number;
  user_speech_duration_sec: number;
  started_at?: string;
  ended_at?: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

export interface ConversationMessage extends BaseWebSocketMessage {
  type: ConversationEventType;
  delta?: string;
  sample_rate?: number;
  transcript?: string;
  session?: {
    id: string;
    model: string;
    voice: string;
  };
  reason?: string;
  report?: SessionReport;
}

// ============================================================================
// 공통 상태 인터페이스
// ============================================================================

export interface BaseWebSocketState {
  isConnected: boolean;
  isReady: boolean;
  error: string | null;
  lastEvent: string | null;
}

export interface AudioState {
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  isRecording: boolean;
  aiMessage: string;
  userTranscript: string;
}

// ============================================================================
// 주제 정하기 (Scenario) 상태
// ============================================================================

export interface ScenarioResult {
  place: string | null;
  conversationPartner: string | null;
  conversationGoal: string | null;
  sessionId?: string;
}

export interface ScenarioState extends BaseWebSocketState, AudioState {
  aiMessageKR?: string;
  isCompleted: boolean;
  scenarioResult: ScenarioResult | null;
}

// ============================================================================
// 대화하기 (Chat) 상태
// ============================================================================

export interface ConversationState extends BaseWebSocketState, AudioState {
  aiMessageKR?: string;
  sessionInfo: { id: string; model: string; voice: string } | null;
  sessionReport: SessionReport | null;
}

// ============================================================================
// WebSocket 옵션
// ============================================================================

export interface BaseWebSocketOptions {
  autoConnect?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ScenarioWebSocketOptions extends BaseWebSocketOptions {
  // 주제 정하기는 추가 옵션 없음
}

export interface ConversationWebSocketOptions extends BaseWebSocketOptions {
  sessionId: string;
  voice?: string;
  showText?: boolean;
}

// ============================================================================
// 공통 반환 인터페이스
// ============================================================================

export interface BaseWebSocketReturn {
  connect: () => void;
  disconnect: () => void;
  sendAudioChunk: (audioData: Float32Array) => void;
  initAudio: () => void;
  toggleMute: (isMuted: boolean) => void;
  togglePause: (isPaused: boolean) => void;
}

export interface ScenarioWebSocketReturn extends BaseWebSocketReturn {
  state: ScenarioState;
  sendText: (text: string) => void;
}

export interface ConversationWebSocketReturn extends BaseWebSocketReturn {
  state: ConversationState;
}
