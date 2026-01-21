import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  decodeJWT,
  isTokenExpired,
  getTokenExpiresIn,
  getTokenExpirationDate,
  isTokenExpiringSoon,
} from "./jwt";

// 테스트용 JWT 토큰 생성 헬퍼
function createTestToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadStr = btoa(JSON.stringify(payload));
  const signature = "test-signature";
  return `${header}.${payloadStr}.${signature}`;
}

describe("jwt utilities", () => {
  describe("decodeJWT", () => {
    it("should decode a valid JWT token", () => {
      const payload = { sub: "user123", exp: 1234567890, name: "Test User" };
      const token = createTestToken(payload);

      const decoded = decodeJWT(token);

      expect(decoded).toEqual(payload);
    });

    it("should return null for invalid token format", () => {
      const result = decodeJWT("invalid-token");
      expect(result).toBeNull();
    });

    it("should return null for token with wrong number of parts", () => {
      const result = decodeJWT("part1.part2");
      expect(result).toBeNull();
    });

    it("should return null for token with invalid base64", () => {
      const result = decodeJWT("header.!!!invalid!!!.signature");
      expect(result).toBeNull();
    });

    it("should handle tokens with url-safe base64 characters", () => {
      // Base64URL 문자를 포함한 토큰 처리
      const payload = { sub: "user-with-special-chars", exp: 1234567890 };
      const token = createTestToken(payload);

      const decoded = decodeJWT(token);
      expect(decoded?.sub).toBe("user-with-special-chars");
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for non-expired token", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = createTestToken({ sub: "user123", exp: futureExp });

      expect(isTokenExpired(token)).toBe(false);
    });

    it("should return true for expired token", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createTestToken({ sub: "user123", exp: pastExp });

      expect(isTokenExpired(token)).toBe(true);
    });

    it("should return true for invalid token", () => {
      expect(isTokenExpired("invalid-token")).toBe(true);
    });

    it("should return true for token without exp claim", () => {
      const token = createTestToken({ sub: "user123" });
      expect(isTokenExpired(token)).toBe(true);
    });
  });

  describe("getTokenExpiresIn", () => {
    it("should return seconds until expiration", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = createTestToken({ sub: "user123", exp: futureExp });

      const expiresIn = getTokenExpiresIn(token);

      // 약간의 오차 허용 (테스트 실행 시간)
      expect(expiresIn).toBeGreaterThan(3590);
      expect(expiresIn).toBeLessThanOrEqual(3600);
    });

    it("should return 0 for expired token", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const token = createTestToken({ sub: "user123", exp: pastExp });

      expect(getTokenExpiresIn(token)).toBe(0);
    });

    it("should return 0 for invalid token", () => {
      expect(getTokenExpiresIn("invalid-token")).toBe(0);
    });

    it("should return 0 for token without exp claim", () => {
      const token = createTestToken({ sub: "user123" });
      expect(getTokenExpiresIn(token)).toBe(0);
    });
  });

  describe("getTokenExpirationDate", () => {
    it("should return Date object for valid token", () => {
      const exp = 1704067200; // 2024-01-01 00:00:00 UTC
      const token = createTestToken({ sub: "user123", exp });

      const date = getTokenExpirationDate(token);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBe(exp * 1000);
    });

    it("should return null for invalid token", () => {
      expect(getTokenExpirationDate("invalid-token")).toBeNull();
    });

    it("should return null for token without exp claim", () => {
      const token = createTestToken({ sub: "user123" });
      expect(getTokenExpirationDate(token)).toBeNull();
    });
  });

  describe("isTokenExpiringSoon", () => {
    it("should return true when token expires within threshold", () => {
      const expIn200Seconds = Math.floor(Date.now() / 1000) + 200;
      const token = createTestToken({ sub: "user123", exp: expIn200Seconds });

      // 기본 threshold는 300초 (5분)
      expect(isTokenExpiringSoon(token)).toBe(true);
    });

    it("should return false when token has plenty of time", () => {
      const expIn1Hour = Math.floor(Date.now() / 1000) + 3600;
      const token = createTestToken({ sub: "user123", exp: expIn1Hour });

      expect(isTokenExpiringSoon(token)).toBe(false);
    });

    it("should return false for already expired token", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 100;
      const token = createTestToken({ sub: "user123", exp: pastExp });

      expect(isTokenExpiringSoon(token)).toBe(false);
    });

    it("should use custom threshold", () => {
      const expIn400Seconds = Math.floor(Date.now() / 1000) + 400;
      const token = createTestToken({ sub: "user123", exp: expIn400Seconds });

      // 기본 threshold (300초)로는 false, 600초로는 true
      expect(isTokenExpiringSoon(token, 300)).toBe(false);
      expect(isTokenExpiringSoon(token, 600)).toBe(true);
    });

    it("should return false for invalid token", () => {
      expect(isTokenExpiringSoon("invalid-token")).toBe(false);
    });
  });
});
