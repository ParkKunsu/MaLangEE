import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInactivityTimer } from "./useInactivityTimer";

describe("useInactivityTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useInactivityTimer());

    expect(result.current.showInactivityMessage).toBe(false);
    expect(result.current.showWaitPopup).toBe(false);
  });

  it("should show inactivity message after inactivityTime", () => {
    const { result } = renderHook(() =>
      useInactivityTimer({ inactivityTime: 1000 })
    );

    act(() => {
      result.current.startInactivityTimer();
    });

    expect(result.current.showInactivityMessage).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.showInactivityMessage).toBe(true);
  });

  it("should show wait popup after waitTime following inactivity", () => {
    const { result } = renderHook(() =>
      useInactivityTimer({ inactivityTime: 1000, waitTime: 500 })
    );

    act(() => {
      result.current.startInactivityTimer();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.showInactivityMessage).toBe(true);
    expect(result.current.showWaitPopup).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.showWaitPopup).toBe(true);
  });

  it("should reset timers and states", () => {
    const { result } = renderHook(() =>
      useInactivityTimer({ inactivityTime: 1000, waitTime: 500 })
    );

    act(() => {
      result.current.startInactivityTimer();
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.showInactivityMessage).toBe(true);
    expect(result.current.showWaitPopup).toBe(true);

    act(() => {
      result.current.resetTimers();
    });

    expect(result.current.showInactivityMessage).toBe(false);
    expect(result.current.showWaitPopup).toBe(false);
  });

  it("should clear timers", () => {
    const { result } = renderHook(() =>
      useInactivityTimer({ inactivityTime: 1000 })
    );

    act(() => {
      result.current.startInactivityTimer();
    });

    act(() => {
      result.current.clearTimers();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.showInactivityMessage).toBe(false);
  });

  it("should allow setting showWaitPopup directly", () => {
    const { result } = renderHook(() => useInactivityTimer());

    act(() => {
      result.current.setShowWaitPopup(true);
    });

    expect(result.current.showWaitPopup).toBe(true);

    act(() => {
      result.current.setShowWaitPopup(false);
    });

    expect(result.current.showWaitPopup).toBe(false);
  });

  it("should use default times when not provided", () => {
    const { result } = renderHook(() => useInactivityTimer());

    act(() => {
      result.current.startInactivityTimer();
    });

    // Default inactivityTime is 15000
    act(() => {
      vi.advanceTimersByTime(14999);
    });

    expect(result.current.showInactivityMessage).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.showInactivityMessage).toBe(true);

    // Default waitTime is 5000
    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(result.current.showWaitPopup).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.showWaitPopup).toBe(true);
  });

  it("should clear timers on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const { result, unmount } = renderHook(() =>
      useInactivityTimer({ inactivityTime: 1000 })
    );

    act(() => {
      result.current.startInactivityTimer();
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("should restart timer when startInactivityTimer is called again", () => {
    const { result } = renderHook(() =>
      useInactivityTimer({ inactivityTime: 1000 })
    );

    act(() => {
      result.current.startInactivityTimer();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Restart the timer
    act(() => {
      result.current.startInactivityTimer();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should not have triggered yet because we restarted
    expect(result.current.showInactivityMessage).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.showInactivityMessage).toBe(true);
  });
});
