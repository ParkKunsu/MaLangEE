import { apiClient } from "@/shared/lib/api-client";

/**
 * 대화 세션 정보
 */
export interface ChatSession {
  id: string;
  user_id: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * 대화 메시지
 */
export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * 세션 상세 정보
 */
export interface SessionDetail {
  session: ChatSession;
  messages: ChatMessage[];
}

/**
 * 힌트 응답
 */
export interface HintResponse {
  session_id: string;
  hints: string[];
}

/**
 * 세션 생성 요청
 */
export interface CreateSessionRequest {
  mode: string;
  metadata?: Record<string, unknown>;
}

/**
 * 대화 API
 * REST API를 통한 세션 관리 및 힌트 조회
 */
export const chatApi = {
  /**
   * 세션 목록 조회 (인증 필요)
   */
  getSessions: async (): Promise<ChatSession[]> => {
    return apiClient.get<ChatSession[]>("/chat/sessions");
  },

  /**
   * 세션 상세 조회 (인증 필요)
   */
  getSession: async (sessionId: string): Promise<SessionDetail> => {
    return apiClient.get<SessionDetail>(`/chat/sessions/${sessionId}`);
  },

  /**
   * 새 세션 생성 (인증 필요)
   */
  createSession: async (data: CreateSessionRequest): Promise<ChatSession> => {
    return apiClient.post<ChatSession>("/chat/sessions", data);
  },

  /**
   * LLM 생성 힌트 조회 (인증 불필요)
   */
  getHints: async (sessionId: string): Promise<HintResponse> => {
    return apiClient.get<HintResponse>(`/chat/hints/${sessionId}`);
  },

  /**
   * 게스트 세션 동기화 (인증 필요)
   */
  syncGuestSession: async (sessionId: string): Promise<SessionDetail> => {
    return apiClient.put<SessionDetail>(`/chat/sessions/${sessionId}/sync`);
  },
};
