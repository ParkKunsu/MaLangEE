import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { translateToKorean } from "./translate";

describe("translateToKorean", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should return empty string for empty input", async () => {
    const result = await translateToKorean("");
    expect(result).toBe("");
  });

  it("should return empty string for whitespace-only input", async () => {
    const result = await translateToKorean("   ");
    expect(result).toBe("");
  });

  it("should return translated text on successful API call", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[["안녕하세요", "Hello"]]])
    });

    const result = await translateToKorean("Hello");

    expect(result).toBe("안녕하세요");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("translate.googleapis.com")
    );
  });

  it("should return empty string on API error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    const result = await translateToKorean("Hello");

    expect(result).toBe("");
    expect(console.error).toHaveBeenCalled();
  });

  it("should return empty string on network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await translateToKorean("Hello");

    expect(result).toBe("");
    expect(console.error).toHaveBeenCalled();
  });

  it("should return empty string for malformed API response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null)
    });

    const result = await translateToKorean("Hello");

    expect(result).toBe("");
  });

  it("should return empty string for empty API response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[]])
    });

    const result = await translateToKorean("Hello");

    expect(result).toBe("");
  });

  it("should properly encode special characters in URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[["번역된 텍스트", "Hello & world"]]])
    });

    await translateToKorean("Hello & world");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("Hello & world"))
    );
  });
});
