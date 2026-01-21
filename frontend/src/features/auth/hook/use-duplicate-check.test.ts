import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLoginIdCheck, useNicknameCheck, usePasswordValidation } from "./use-duplicate-check";

// Mock authApi
vi.mock("../api", () => ({
  authApi: {
    checkLoginId: vi.fn(),
    checkNickname: vi.fn(),
  },
}));

import { authApi } from "../api";

describe("useLoginIdCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should initialize with null values", () => {
    const { result } = renderHook(() => useLoginIdCheck(""));

    expect(result.current.error).toBeNull();
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isAvailable).toBeNull();
  });

  it("should not check when value is too short", async () => {
    const { result } = renderHook(() => useLoginIdCheck("ab"));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(authApi.checkLoginId).not.toHaveBeenCalled();
    expect(result.current.isAvailable).toBeNull();
  });

  it("should check after debounce when value is valid", async () => {
    vi.mocked(authApi.checkLoginId).mockResolvedValue({ is_available: true });

    renderHook(() => useLoginIdCheck("test@test.com"));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(authApi.checkLoginId).toHaveBeenCalledWith("test@test.com");
  });

  it("should set isAvailable to true when available", async () => {
    vi.mocked(authApi.checkLoginId).mockResolvedValue({ is_available: true });

    const { result } = renderHook(() => useLoginIdCheck("test@test.com"));

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should set error when not available", async () => {
    vi.mocked(authApi.checkLoginId).mockResolvedValue({ is_available: false });

    const { result } = renderHook(() => useLoginIdCheck("taken@test.com"));

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.error).toBe("이미 사용중인 이메일입니다");
  });

  it("should handle API error", async () => {
    vi.mocked(authApi.checkLoginId).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useLoginIdCheck("test@test.com"));

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.isAvailable).toBeNull();
  });

  it("should have trigger function", () => {
    const { result } = renderHook(() => useLoginIdCheck("test@test.com"));
    expect(typeof result.current.trigger).toBe("function");
  });
});

describe("useNicknameCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should initialize with null values", () => {
    const { result } = renderHook(() => useNicknameCheck(""));

    expect(result.current.error).toBeNull();
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isAvailable).toBeNull();
  });

  it("should not check when value is too short", async () => {
    renderHook(() => useNicknameCheck("a"));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(authApi.checkNickname).not.toHaveBeenCalled();
  });

  it("should check after debounce when value is valid", async () => {
    vi.mocked(authApi.checkNickname).mockResolvedValue({ is_available: true });

    renderHook(() => useNicknameCheck("TestNick"));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(authApi.checkNickname).toHaveBeenCalledWith("TestNick");
  });

  it("should set error when nickname is taken", async () => {
    vi.mocked(authApi.checkNickname).mockResolvedValue({ is_available: false });

    const { result } = renderHook(() => useNicknameCheck("TakenNick"));

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.error).toBe("이미 사용중인 닉네임입니다");
  });
});

describe("usePasswordValidation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should initialize with null values", () => {
    const { result } = renderHook(() => usePasswordValidation(""));

    expect(result.current.error).toBeNull();
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isValid).toBeNull();
  });

  it("should validate password after debounce", async () => {
    const { result } = renderHook(() => usePasswordValidation("ValidPass1!"));

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.isChecking).toBe(false);
  });

  it("should set isValid to true for valid password", async () => {
    const { result } = renderHook(() => usePasswordValidation("ValidPass1!"));

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should set error for invalid password", async () => {
    const { result } = renderHook(() => usePasswordValidation("weak"));

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it("should reset when value becomes empty", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePasswordValidation(value),
      { initialProps: { value: "ValidPass1!" } }
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.isValid).toBe(true);

    rerender({ value: "" });

    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBeNull();
  });
});
