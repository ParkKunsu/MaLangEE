import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isDev,
  debugLog,
  debugError,
  debugWarn,
  debugInfo,
  prodLog,
  prodError,
  prodWarn,
} from "./debug";

describe("debug utilities", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
  });

  describe("isDev", () => {
    it("should return true in development environment", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(isDev()).toBe(true);
    });

    it("should return false in production environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(isDev()).toBe(false);
    });

    it("should return false in test environment", () => {
      vi.stubEnv("NODE_ENV", "test");
      expect(isDev()).toBe(false);
    });
  });

  describe("debugLog", () => {
    it("should log in development environment", () => {
      vi.stubEnv("NODE_ENV", "development");
      debugLog("test message", { data: 123 });
      expect(console.log).toHaveBeenCalledWith("test message", { data: 123 });
    });

    it("should not log in production environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      debugLog("test message");
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe("debugError", () => {
    it("should log error in development environment", () => {
      vi.stubEnv("NODE_ENV", "development");
      debugError("error message", new Error("test"));
      expect(console.error).toHaveBeenCalledWith(
        "error message",
        expect.any(Error)
      );
    });

    it("should not log error in production environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      debugError("error message");
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("debugWarn", () => {
    it("should log warning in development environment", () => {
      vi.stubEnv("NODE_ENV", "development");
      debugWarn("warning message");
      expect(console.warn).toHaveBeenCalledWith("warning message");
    });

    it("should not log warning in production environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      debugWarn("warning message");
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe("debugInfo", () => {
    it("should log info in development environment", () => {
      vi.stubEnv("NODE_ENV", "development");
      debugInfo("info message");
      expect(console.info).toHaveBeenCalledWith("info message");
    });

    it("should not log info in production environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      debugInfo("info message");
      expect(console.info).not.toHaveBeenCalled();
    });
  });

  describe("prodLog", () => {
    it("should always log regardless of environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      prodLog("important message");
      expect(console.log).toHaveBeenCalledWith("important message");

      vi.stubEnv("NODE_ENV", "development");
      prodLog("dev message");
      expect(console.log).toHaveBeenCalledWith("dev message");
    });
  });

  describe("prodError", () => {
    it("should always log error regardless of environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      prodError("critical error");
      expect(console.error).toHaveBeenCalledWith("critical error");
    });
  });

  describe("prodWarn", () => {
    it("should always log warning regardless of environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      prodWarn("important warning");
      expect(console.warn).toHaveBeenCalledWith("important warning");
    });
  });
});
