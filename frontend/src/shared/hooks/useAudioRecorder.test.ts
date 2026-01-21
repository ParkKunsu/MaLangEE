import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioRecorder } from "./useAudioRecorder";

// Mock AudioContext
class MockAudioContext {
  sampleRate: number;
  destination = {};

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate || 48000;
  }

  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));

  createScriptProcessor = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null as ((e: any) => void) | null,
  }));

  close = vi.fn();
}

// Mock MediaStream
class MockMediaStream {
  tracks = [{ stop: vi.fn() }];

  getTracks() {
    return this.tracks;
  }
}

describe("useAudioRecorder", () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockMediaStream: MockMediaStream;
  let mockAudioContext: MockAudioContext;
  let mockProcessor: ReturnType<MockAudioContext["createScriptProcessor"]>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMediaStream = new MockMediaStream();
    mockGetUserMedia = vi.fn().mockResolvedValue(mockMediaStream);

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    mockAudioContext = new MockAudioContext();
    mockProcessor = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    };
    mockAudioContext.createScriptProcessor.mockReturnValue(mockProcessor);

    // @ts-ignore
    global.AudioContext = vi.fn(() => mockAudioContext);
    // @ts-ignore
    global.window = {
      AudioContext: vi.fn(() => mockAudioContext),
      alert: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with isRecording false", () => {
    const onAudioData = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAudioData }));

    expect(result.current.isRecording).toBe(false);
  });

  it("should start recording and set isRecording to true", async () => {
    const onAudioData = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAudioData }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockGetUserMedia).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });

  it("should stop recording and set isRecording to false", async () => {
    const onAudioData = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAudioData }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(mockMediaStream.tracks[0].stop).toHaveBeenCalled();
  });

  it("should call onAudioData when processing audio", async () => {
    const onAudioData = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAudioData }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate audio processing
    const mockInputBuffer = {
      getChannelData: vi.fn().mockReturnValue(new Float32Array([0.1, 0.2, 0.3])),
    };

    act(() => {
      if (mockProcessor.onaudioprocess) {
        mockProcessor.onaudioprocess({ inputBuffer: mockInputBuffer } as any);
      }
    });

    expect(onAudioData).toHaveBeenCalled();
  });

  it("should call onVolumeChange when provided", async () => {
    const onAudioData = vi.fn();
    const onVolumeChange = vi.fn();
    const { result } = renderHook(() =>
      useAudioRecorder({ onAudioData, onVolumeChange })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate audio processing
    const mockInputBuffer = {
      getChannelData: vi.fn().mockReturnValue(new Float32Array(100).fill(0.5)),
    };

    act(() => {
      if (mockProcessor.onaudioprocess) {
        mockProcessor.onaudioprocess({ inputBuffer: mockInputBuffer } as any);
      }
    });

    expect(onVolumeChange).toHaveBeenCalled();
  });

  it("should use custom sample rate", async () => {
    const onAudioData = vi.fn();
    const customSampleRate = 16000;

    const { result } = renderHook(() =>
      useAudioRecorder({ onAudioData, sampleRate: customSampleRate })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.objectContaining({
          sampleRate: { ideal: customSampleRate },
        }),
      })
    );
  });

  it("should not start recording if already recording", async () => {
    const onAudioData = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAudioData }));

    await act(async () => {
      await result.current.startRecording();
    });

    const callCount = mockGetUserMedia.mock.calls.length;

    await act(async () => {
      await result.current.startRecording();
    });

    // Should not call getUserMedia again
    expect(mockGetUserMedia).toHaveBeenCalledTimes(callCount);
  });

  it("should clean up on unmount", async () => {
    const onAudioData = vi.fn();
    const { result, unmount } = renderHook(() => useAudioRecorder({ onAudioData }));

    await act(async () => {
      await result.current.startRecording();
    });

    unmount();

    expect(mockMediaStream.tracks[0].stop).toHaveBeenCalled();
  });

  it("should handle getUserMedia failure", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));

    const onAudioData = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAudioData }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
  });

  it("should fallback to basic constraints on failure", async () => {
    // First call fails, second succeeds
    mockGetUserMedia
      .mockRejectedValueOnce(new Error("Constraint not satisfied"))
      .mockResolvedValueOnce(mockMediaStream);

    const onAudioData = vi.fn();
    const { result } = renderHook(() => useAudioRecorder({ onAudioData }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Should have tried twice with different constraints
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
    expect(mockGetUserMedia).toHaveBeenLastCalledWith({ audio: true });
    expect(result.current.isRecording).toBe(true);
  });
});
