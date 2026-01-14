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
    process.env.NODE_ENV = "development";
    vi.resetModules();

    const { config } = await import("./config");
    expect(config.apiUrl).toBe("/api/v1");
  });

  it("returns full URL for apiUrl in production mode", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    vi.resetModules();

    const { config } = await import("./config");
    expect(config.apiUrl).toBe("https://api.example.com/api/v1");
  });

  it("reads NEXT_PUBLIC_LOCALHOST_URL from env", async () => {
    process.env.NEXT_PUBLIC_LOCALHOST_URL = "http://localhost:3000";
    vi.resetModules();

    const { config } = await import("./config");
    expect(config.localhostUrl).toBe("http://localhost:3000");
  });

  it("reads NEXT_PUBLIC_API_URL from env", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.test.com";
    vi.resetModules();

    const { config } = await import("./config");
    expect(config.apiBaseUrl).toBe("https://api.test.com");
  });
});
