/**
 * 대화 세션 관련 타입 정의
 */

/**
 * 대화 메시지
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  duration_sec: number;
}

/**
 * 대화 세션 요약 (목록 조회용)
 */
export interface ChatSession {
  session_id: string;
  title: string;
  started_at: string;
  ended_at: string;
  total_duration_sec: number;
  user_speech_duration_sec: number;
  created_at: string;
  updated_at: string;
  message_count: number;
}

/**
 * 대화 세션 상세 (메시지 포함)
 */
export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
  scenario_place?: string | null;
  scenario_partner?: string | null;
  scenario_goal?: string | null;
  scenario_state_json?: Record<string, unknown> | null;
  scenario_completed_at?: string | null;
  voice?: string | null;
  show_text?: boolean | null;
  deleted?: boolean | null;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  total: number;
}

/**
 * 대화 내역 페이지에서 사용할 UI 데이터 타입
 */
export interface ChatHistoryItem {
  id: string;
  date: string;
  title: string;
  duration: string;
  totalDurationSec: number;
  userSpeechDurationSec: number;
}

