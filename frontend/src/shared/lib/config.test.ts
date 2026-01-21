import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exports apiBasePath as /api/v1", async () => {
    const { config } = await import("./config");
    expect(config.apiBasePath).toBe("/api/v1");
  });

  it("returns apiBasePath for apiUrl in development mode", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = "development";
    vi.resetModules();

    const { config } = await import("./config");
    expect(config.apiUrl).toBe("/api/v1");
  });

  it("returns relative path for apiUrl in browser environment (Mixed Content prevention)", async () => {
    // jsdom 환경에서는 window 객체가 있으므로 항상 상대 경로 반환
    // Mixed Content 에러 방지를 위해 클라이언트에서는 상대 경로 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    vi.resetModules();

    const { config } = await import("./config");
    // 브라우저 환경(jsdom)에서는 window가 있으므로 상대 경로 반환
    expect(config.apiUrl).toBe("/api/v1");
  });


  it("reads NEXT_PUBLIC_API_URL from env", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test.com";
    vi.resetModules();

    const { config } = await import("./config");
    expect(config.apiBaseUrl).toBe("https://api.test.com");
  });
});
