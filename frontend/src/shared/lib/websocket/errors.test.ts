import { describe, it, expect } from "vitest";
import {
  WebSocketErrorCode,
  WebSocketErrorSchema,
  createWebSocketError,
  isRecoverableError,
  getErrorMessage,
} from "./errors";

describe("errors", () => {
  describe("WebSocketErrorCode", () => {
    it("should have all expected error codes", () => {
      expect(WebSocketErrorCode.CONNECTION_FAILED).toBe("CONNECTION_FAILED");
      expect(WebSocketErrorCode.AUTH_FAILED).toBe("AUTH_FAILED");
      expect(WebSocketErrorCode.MESSAGE_PARSE_ERROR).toBe("MESSAGE_PARSE_ERROR");
      expect(WebSocketErrorCode.SEND_FAILED).toBe("SEND_FAILED");
      expect(WebSocketErrorCode.TIMEOUT).toBe("TIMEOUT");
      expect(WebSocketErrorCode.UNEXPECTED_CLOSE).toBe("UNEXPECTED_CLOSE");
    });
  });

  describe("WebSocketErrorSchema", () => {
    it("should validate correct error object", () => {
      const error = {
        code: "CONNECTION_FAILED" as const,
        message: "Failed to connect",
        timestamp: new Date(),
        recoverable: true,
      };

      const result = WebSocketErrorSchema.safeParse(error);

      expect(result.success).toBe(true);
    });

    it("should validate error with context", () => {
      const error = {
        code: "AUTH_FAILED" as const,
        message: "Authentication failed",
        context: { userId: "123", attempt: 1 },
        timestamp: new Date(),
        recoverable: false,
      };

      const result = WebSocketErrorSchema.safeParse(error);

      expect(result.success).toBe(true);
    });

    it("should reject invalid error code", () => {
      const error = {
        code: "INVALID_CODE",
        message: "Test",
        timestamp: new Date(),
        recoverable: true,
      };

      const result = WebSocketErrorSchema.safeParse(error);

      expect(result.success).toBe(false);
    });
  });

  describe("createWebSocketError", () => {
    it("should create error with required fields", () => {
      const error = createWebSocketError("CONNECTION_FAILED", "Failed to connect");

      expect(error.code).toBe("CONNECTION_FAILED");
      expect(error.message).toBe("Failed to connect");
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.context).toBeUndefined();
    });

    it("should create error with context", () => {
      const context = { url: "wss://example.com", attempt: 3 };
      const error = createWebSocketError("CONNECTION_FAILED", "Failed to connect", context);

      expect(error.context).toEqual(context);
    });

    it("should mark recoverable errors correctly", () => {
      expect(createWebSocketError("TIMEOUT", "Timeout").recoverable).toBe(true);
      expect(createWebSocketError("UNEXPECTED_CLOSE", "Closed").recoverable).toBe(true);
      expect(createWebSocketError("CONNECTION_FAILED", "Failed").recoverable).toBe(true);
    });

    it("should mark non-recoverable errors correctly", () => {
      expect(createWebSocketError("AUTH_FAILED", "Auth failed").recoverable).toBe(false);
      expect(createWebSocketError("MESSAGE_PARSE_ERROR", "Parse error").recoverable).toBe(false);
      expect(createWebSocketError("SEND_FAILED", "Send failed").recoverable).toBe(false);
    });
  });

  describe("isRecoverableError", () => {
    it("should return true for recoverable errors", () => {
      const error = createWebSocketError("TIMEOUT", "Timeout");
      expect(isRecoverableError(error)).toBe(true);
    });

    it("should return false for non-recoverable errors", () => {
      const error = createWebSocketError("AUTH_FAILED", "Auth failed");
      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("should return user-friendly message for CONNECTION_FAILED", () => {
      const error = createWebSocketError("CONNECTION_FAILED", "Technical error");
      const message = getErrorMessage(error);

      expect(message).toBe("서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.");
    });

    it("should return user-friendly message for AUTH_FAILED", () => {
      const error = createWebSocketError("AUTH_FAILED", "Technical error");
      const message = getErrorMessage(error);

      expect(message).toBe("인증에 실패했습니다. 다시 로그인해주세요.");
    });

    it("should return user-friendly message for MESSAGE_PARSE_ERROR", () => {
      const error = createWebSocketError("MESSAGE_PARSE_ERROR", "Technical error");
      const message = getErrorMessage(error);

      expect(message).toBe("서버 응답을 처리할 수 없습니다.");
    });

    it("should return user-friendly message for SEND_FAILED", () => {
      const error = createWebSocketError("SEND_FAILED", "Technical error");
      const message = getErrorMessage(error);

      expect(message).toBe("메시지 전송에 실패했습니다.");
    });

    it("should return user-friendly message for TIMEOUT", () => {
      const error = createWebSocketError("TIMEOUT", "Technical error");
      const message = getErrorMessage(error);

      expect(message).toBe("서버 응답 시간이 초과되었습니다.");
    });

    it("should return user-friendly message for UNEXPECTED_CLOSE", () => {
      const error = createWebSocketError("UNEXPECTED_CLOSE", "Technical error");
      const message = getErrorMessage(error);

      expect(message).toBe("연결이 예기치 않게 종료되었습니다.");
    });
  });
});
