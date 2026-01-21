/**
 * WebSocket URL 구성 유틸리티
 * 중복된 URL 구성 로직을 통합
 */

export interface WebSocketUrlConfig {
  /** WebSocket 엔드포인트 경로 */
  endpoint: string;
  /** URL 쿼리 파라미터 */
  params?: Record<string, string>;
}

/**
 * 환경에 맞는 WebSocket Base URL을 반환
 */
export const getWebSocketBaseUrl = (): string => {
  // 1. 환경 변수에서 직접 WebSocket URL 사용
  const envWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envWsUrl) {
    return envWsUrl;
  }

  // 2. API URL을 WebSocket URL로 변환
  if (process.env.NEXT_PUBLIC_API_URL) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    let wsUrl = apiUrl.replace(/^http/, "ws");

    // HTTPS 환경에서 WSS로 업그레이드
    if (typeof window !== "undefined" && window.location.protocol === "https:" && wsUrl.startsWith("ws:")) {
      wsUrl = wsUrl.replace(/^ws:/, "wss:");
    }

    return wsUrl;
  }

  // 3. 현재 호스트 기반 URL 생성
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${protocol}://${host}${port}`;
  }

  throw new Error("Cannot determine WebSocket URL: No environment variables or window object available");
};

/**
 * WebSocket URL을 구성하여 반환
 */
export const buildWebSocketUrl = (config: WebSocketUrlConfig): string => {
  const baseUrl = getWebSocketBaseUrl();
  const { endpoint, params } = config;

  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();

  return queryString ? `${baseUrl}${endpoint}?${queryString}` : `${baseUrl}${endpoint}`;
};

/**
 * 시나리오 WebSocket URL 생성
 */
export const buildScenarioWebSocketUrl = (token: string | null): string => {
  const endpoint = token ? "/api/v1/scenarios/ws/scenario" : "/api/v1/scenarios/ws/guest-scenario";

  const params: Record<string, string> = {};
  if (token) {
    params.token = token;
  }

  return buildWebSocketUrl({ endpoint, params });
};

/**
 * 대화 WebSocket URL 생성
 */
export const buildConversationWebSocketUrl = (
  sessionId: string,
  token: string | null,
  voice: string = "alloy",
  showText: boolean = true
): string => {
  const endpoint = token ? `/api/v1/chat/ws/chat/${sessionId}` : `/api/v1/chat/ws/guest-chat/${sessionId}`;

  const params: Record<string, string> = {
    voice,
    show_text: String(showText),
  };

  if (token) {
    params.token = token;
  }

  return buildWebSocketUrl({ endpoint, params });
};
