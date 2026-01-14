import { tokenStorage } from "@/features/auth";
import { config } from "./config";

export type WebSocketMessageType =
  | "ready"
  | "message"
  | "response.audio.delta"
  | "input_audio.transcript"
  | "conversation.completed"
  | "error";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  content?: string;
  delta?: string;
  sample_rate?: number;
  transcript?: string;
  json?: Record<string, unknown>;
  completed?: boolean;
  message?: string;
  session_id?: string;
}

export interface WebSocketClientConfig {
  endpoint: string;
  onMessage: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  requireAuth?: boolean;
}

/**
 * WebSocket 클라이언트
 * LLM 실시간 대화를 위한 WebSocket 연결 관리
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;

  constructor(config: WebSocketClientConfig) {
    this.config = config;
  }

  private getWebSocketUrl(): string {
    // 개발 환경인지 확인
    const isDevelopment = process.env.NODE_ENV === 'development';

    // WebSocket URL 구성
    let wsUrl: string;

    if (isDevelopment && config.apiBaseUrl) {
      // 개발 환경: HTTP URL을 WebSocket URL로 변환
      const httpUrl = config.apiBaseUrl;
      wsUrl = httpUrl.replace(/^http/, 'ws');
    } else if (typeof window !== 'undefined') {
      // 프로덕션 또는 브라우저 환경: 현재 호스트 기반
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}`;
    } else {
      throw new Error('Cannot determine WebSocket URL');
    }

    // 엔드포인트 추가
    const fullUrl = `${wsUrl}${config.apiBasePath}${this.config.endpoint}`;

    // 인증이 필요한 경우 토큰 추가
    if (this.config.requireAuth) {
      const token = tokenStorage.get();
      if (token) {
        return `${fullUrl}?token=${encodeURIComponent(token)}`;
      }
    }

    return fullUrl;
  }

  connect(): void {
    try {
      const url = this.getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.config.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.config.onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.config.onClose?.();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.config.onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.config.onError?.(error as Event);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay);
    }
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
