import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocketBase } from "./useWebSocketBase";

// Mock debugLog
vi.mock("@/shared/lib/debug", () => ({
  debugLog: vi.fn(),
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Auto-trigger onopen in next tick
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: "Normal closure" } as CloseEvent);
  }
}

// Mock AudioContext
class MockAudioContext {
  sampleRate = 24000;
  state = "running";
  destination = {};
  currentTime = 0;

  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      value: 1,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  }));

  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));

  createScriptProcessor = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null,
  }));

  createBuffer = vi.fn((channels, length, sampleRate) => ({
    copyToChannel: vi.fn(),
    duration: length / sampleRate,
  }));

  createBufferSource = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
    onended: null,
  }));

  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn();
}

// Mock MediaStream
class MockMediaStream {
  tracks = [{ stop: vi.fn() }];
  getTracks() {
    return this.tracks;
  }
}

describe("useWebSocketBase", () => {
  let mockWs: MockWebSocket;
  const mockGetUserMedia = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock WebSocket
    global.WebSocket = vi.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    }) as unknown as typeof WebSocket;

    (global.WebSocket as unknown as typeof MockWebSocket).OPEN = MockWebSocket.OPEN;
    (global.WebSocket as unknown as typeof MockWebSocket).CLOSED = MockWebSocket.CLOSED;
    (global.WebSocket as unknown as typeof MockWebSocket).CONNECTING = MockWebSocket.CONNECTING;
    (global.WebSocket as unknown as typeof MockWebSocket).CLOSING = MockWebSocket.CLOSING;

    // Mock AudioContext
    global.AudioContext = MockAudioContext as unknown as typeof AudioContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as unknown as Record<string, unknown>).window = {
      AudioContext: MockAudioContext,
      webkitAudioContext: MockAudioContext,
      atob: global.atob || ((str: string) => Buffer.from(str, "base64").toString("binary")),
      btoa: global.btoa || ((str: string) => Buffer.from(str, "binary").toString("base64")),
    };

    // Mock navigator.mediaDevices
    Object.defineProperty(global, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: mockGetUserMedia.mockResolvedValue(new MockMediaStream()),
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReady).toBe(false);
      expect(result.current.isAiSpeaking).toBe(false);
      expect(result.current.isUserSpeaking).toBe(false);
      expect(result.current.isRecording).toBe(false);
      expect(result.current.logs).toEqual([]);
    });
  });

  describe("connect", () => {
    it("should connect to WebSocket", async () => {
      const onMessage = vi.fn();
      const onOpen = vi.fn();

      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com/ws",
          onMessage,
          onOpen,
          autoConnect: false,
        })
      );

      act(() => {
        result.current.connect();
      });

      // Trigger onopen
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(global.WebSocket).toHaveBeenCalledWith("ws://test.com/ws");
      expect(result.current.isConnected).toBe(true);
      expect(onOpen).toHaveBeenCalled();
    });

    it("should not connect if URL is empty", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      act(() => {
        result.current.connect();
      });

      expect(result.current.isConnected).toBe(false);
    });

    it("should auto-connect when autoConnect is true", async () => {
      renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(global.WebSocket).toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("should disconnect and clean up", async () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      // Connect first
      act(() => {
        result.current.connect();
      });

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(result.current.isConnected).toBe(true);

      // Disconnect
      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReady).toBe(false);
    });
  });

  describe("addLog", () => {
    it("should add log entries with timestamp", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      act(() => {
        result.current.addLog("Test message");
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toContain("Test message");
    });
  });

  describe("audio functions", () => {
    it("should initialize audio context", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      act(() => {
        result.current.initAudio();
      });

      expect(result.current.audioContextRef.current).toBeDefined();
    });

    it("should encode audio data", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      const testData = new Float32Array([0.5, -0.5, 0.25, -0.25]);
      const encoded = result.current.encodeAudio(testData);

      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("should stop audio playback", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      act(() => {
        result.current.initAudio();
      });

      act(() => {
        result.current.stopAudio();
      });

      expect(result.current.isAiSpeaking).toBe(false);
    });
  });

  describe("microphone functions", () => {
    it("should start microphone", async () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      const onAudioData = vi.fn();

      await act(async () => {
        await result.current.startMicrophone(onAudioData);
      });

      expect(mockGetUserMedia).toHaveBeenCalled();
      expect(result.current.isRecording).toBe(true);
    });

    it("should stop microphone", async () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      await act(async () => {
        await result.current.startMicrophone(vi.fn());
      });

      act(() => {
        result.current.stopMicrophone();
      });

      expect(result.current.isRecording).toBe(false);
    });
  });

  describe("reconnection", () => {
    it("should attempt reconnection on close", async () => {
      // Mock Math.random for predictable backoff delay
      const originalRandom = Math.random;
      Math.random = () => 0.5; // Middle value, no jitter

      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
          maxReconnectAttempts: 3,
        })
      );

      act(() => {
        result.current.connect();
      });

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      // Simulate close
      act(() => {
        mockWs.close();
      });

      // Wait for reconnect delay (exponential backoff with jitter)
      // Initial delay: 1000ms, jitter factor 0.3 → 700ms~1300ms
      // Using 1500ms to account for maximum jitter
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      // WebSocket should be called twice (initial + reconnect)
      expect(global.WebSocket).toHaveBeenCalledTimes(2);

      // Restore Math.random
      Math.random = originalRandom;
    });

    it("should not reconnect on manual disconnect", async () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
          maxReconnectAttempts: 3,
        })
      );

      act(() => {
        result.current.connect();
      });

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      // Manual disconnect
      act(() => {
        result.current.disconnect();
      });

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should only have initial connection
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });
  });

  describe("toggleMute", () => {
    it("should toggle mute state", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      act(() => {
        result.current.initAudio();
      });

      // Toggle mute
      act(() => {
        result.current.toggleMute(true);
      });

      // Toggle unmute
      act(() => {
        result.current.toggleMute(false);
      });

      // Check logs contain mute/unmute messages
      expect(result.current.logs.some((log) => log.includes("Muted"))).toBe(true);
      expect(result.current.logs.some((log) => log.includes("Unmuted"))).toBe(true);
    });
  });

  describe("setIsReady", () => {
    it("should update isReady state", () => {
      const { result } = renderHook(() =>
        useWebSocketBase({
          getWebSocketUrl: () => "ws://test.com",
          onMessage: vi.fn(),
          autoConnect: false,
        })
      );

      act(() => {
        result.current.setIsReady(true);
      });

      expect(result.current.isReady).toBe(true);

      act(() => {
        result.current.setIsReady(false);
      });

      expect(result.current.isReady).toBe(false);
    });
  });
});
