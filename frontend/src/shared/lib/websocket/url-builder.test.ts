import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getWebSocketBaseUrl,
  buildWebSocketUrl,
  buildScenarioWebSocketUrl,
  buildConversationWebSocketUrl,
} from "./url-builder";

describe("url-builder", () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Mock window
    global.window = {
      location: {
        protocol: "https:",
        hostname: "localhost",
        port: "3000",
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.window = originalWindow;
  });

  describe("getWebSocketBaseUrl", () => {
    it("should use NEXT_PUBLIC_WS_URL if available", () => {
      process.env.NEXT_PUBLIC_WS_URL = "wss://ws.example.com";

      const result = getWebSocketBaseUrl();

      expect(result).toBe("wss://ws.example.com");
    });

    it("should convert NEXT_PUBLIC_API_URL to WebSocket URL", () => {
      delete process.env.NEXT_PUBLIC_WS_URL;
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      const result = getWebSocketBaseUrl();

      expect(result).toBe("wss://api.example.com");
    });

    it("should convert http to ws for API URL", () => {
      delete process.env.NEXT_PUBLIC_WS_URL;
      process.env.NEXT_PUBLIC_API_URL = "http://api.example.com";
      global.window = {
        location: { protocol: "http:", hostname: "localhost", port: "" },
      } as unknown as Window & typeof globalThis;

      const result = getWebSocketBaseUrl();

      expect(result).toBe("ws://api.example.com");
    });

    it("should upgrade ws to wss when on HTTPS", () => {
      delete process.env.NEXT_PUBLIC_WS_URL;
      process.env.NEXT_PUBLIC_API_URL = "http://api.example.com";
      global.window = {
        location: { protocol: "https:", hostname: "localhost", port: "" },
      } as unknown as Window & typeof globalThis;

      const result = getWebSocketBaseUrl();

      expect(result).toBe("wss://api.example.com");
    });

    it("should use window.location as fallback", () => {
      delete process.env.NEXT_PUBLIC_WS_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      const result = getWebSocketBaseUrl();

      expect(result).toBe("wss://localhost:3000");
    });

    it("should handle port correctly when empty", () => {
      delete process.env.NEXT_PUBLIC_WS_URL;
      delete process.env.NEXT_PUBLIC_API_URL;
      global.window = {
        location: { protocol: "https:", hostname: "example.com", port: "" },
      } as unknown as Window & typeof globalThis;

      const result = getWebSocketBaseUrl();

      expect(result).toBe("wss://example.com");
    });
  });

  describe("buildWebSocketUrl", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_WS_URL = "wss://ws.example.com";
    });

    it("should build URL with endpoint only", () => {
      const result = buildWebSocketUrl({ endpoint: "/api/v1/ws" });

      expect(result).toBe("wss://ws.example.com/api/v1/ws");
    });

    it("should build URL with params", () => {
      const result = buildWebSocketUrl({
        endpoint: "/api/v1/ws",
        params: { token: "abc123", voice: "alloy" },
      });

      expect(result).toBe("wss://ws.example.com/api/v1/ws?token=abc123&voice=alloy");
    });

    it("should handle empty params", () => {
      const result = buildWebSocketUrl({
        endpoint: "/api/v1/ws",
        params: {},
      });

      expect(result).toBe("wss://ws.example.com/api/v1/ws");
    });
  });

  describe("buildScenarioWebSocketUrl", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_WS_URL = "wss://ws.example.com";
    });

    it("should build authenticated scenario URL", () => {
      const result = buildScenarioWebSocketUrl("test-token");

      expect(result).toBe("wss://ws.example.com/api/v1/scenarios/ws/scenario?token=test-token");
    });

    it("should build guest scenario URL when no token", () => {
      const result = buildScenarioWebSocketUrl(null);

      expect(result).toBe("wss://ws.example.com/api/v1/scenarios/ws/guest-scenario");
    });
  });

  describe("buildConversationWebSocketUrl", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_WS_URL = "wss://ws.example.com";
    });

    it("should build authenticated conversation URL", () => {
      const result = buildConversationWebSocketUrl("session-123", "test-token", "alloy", true);

      expect(result).toContain("wss://ws.example.com/api/v1/chat/ws/chat/session-123");
      expect(result).toContain("token=test-token");
      expect(result).toContain("voice=alloy");
      expect(result).toContain("show_text=true");
    });

    it("should build guest conversation URL when no token", () => {
      const result = buildConversationWebSocketUrl("session-123", null);

      expect(result).toContain("wss://ws.example.com/api/v1/chat/ws/guest-chat/session-123");
      expect(result).not.toContain("token=");
    });

    it("should use default values for voice and showText", () => {
      const result = buildConversationWebSocketUrl("session-123", null);

      expect(result).toContain("voice=alloy");
      expect(result).toContain("show_text=true");
    });

    it("should allow custom voice and showText", () => {
      const result = buildConversationWebSocketUrl("session-123", null, "echo", false);

      expect(result).toContain("voice=echo");
      expect(result).toContain("show_text=false");
    });
  });
});
