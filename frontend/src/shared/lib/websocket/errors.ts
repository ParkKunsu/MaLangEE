/**
 * WebSocket 에러 타입 및 팩토리
 */
import { z } from "zod";

/** WebSocket 에러 코드 */
export const WebSocketErrorCode = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  AUTH_FAILED: "AUTH_FAILED",
  MESSAGE_PARSE_ERROR: "MESSAGE_PARSE_ERROR",
  SEND_FAILED: "SEND_FAILED",
  TIMEOUT: "TIMEOUT",
  UNEXPECTED_CLOSE: "UNEXPECTED_CLOSE",
} as const;

export type WebSocketErrorCode = (typeof WebSocketErrorCode)[keyof typeof WebSocketErrorCode];

/** WebSocket 에러 스키마 */
export const WebSocketErrorSchema = z.object({
  code: z.enum([
    "CONNECTION_FAILED",
    "AUTH_FAILED",
    "MESSAGE_PARSE_ERROR",
    "SEND_FAILED",
    "TIMEOUT",
    "UNEXPECTED_CLOSE",
  ]),
  message: z.string(),
  context: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.date(),
  recoverable: z.boolean(),
});

export type WebSocketError = z.infer<typeof WebSocketErrorSchema>;

/** 복구 가능한 에러 코드 */
const RECOVERABLE_ERRORS: WebSocketErrorCode[] = ["TIMEOUT", "UNEXPECTED_CLOSE", "CONNECTION_FAILED"];

/**
 * WebSocket 에러 생성 팩토리
 */
export const createWebSocketError = (
  code: WebSocketErrorCode,
  message: string,
  context?: Record<string, unknown>
): WebSocketError => ({
  code,
  message,
  context,
  timestamp: new Date(),
  recoverable: RECOVERABLE_ERRORS.includes(code),
});

/**
 * 에러가 복구 가능한지 확인
 */
export const isRecoverableError = (error: WebSocketError): boolean => error.recoverable;

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
export const getErrorMessage = (error: WebSocketError): string => {
  const messages: Record<WebSocketErrorCode, string> = {
    CONNECTION_FAILED: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
    AUTH_FAILED: "인증에 실패했습니다. 다시 로그인해주세요.",
    MESSAGE_PARSE_ERROR: "서버 응답을 처리할 수 없습니다.",
    SEND_FAILED: "메시지 전송에 실패했습니다.",
    TIMEOUT: "서버 응답 시간이 초과되었습니다.",
    UNEXPECTED_CLOSE: "연결이 예기치 않게 종료되었습니다.",
  };

  return messages[error.code] || error.message;
};
