import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocketClient, WebSocketMessage, WebSocketClientConfig } from "./websocket-client";

// Mock tokenStorage
const mockGetToken = vi.fn();
vi.mock("@/features/auth", () => ({
  tokenStorage: {
    get: () => mockGetToken(),
  },
}));

// Mock config
vi.mock("./config", () => ({
  config: {
    apiBaseUrl: "http://localhost:8080",
    apiBasePath: "/api/v1",
  },
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: WebSocketMessage) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateError(event: Event) {
    this.onerror?.(event);
  }
}

// Store original WebSocket
const OriginalWebSocket = global.WebSocket;

describe("WebSocketClient", () => {
  let mockWs: MockWebSocket;
  let onMessage: ReturnType<typeof vi.fn>;
  let onOpen: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    onMessage = vi.fn();
    onOpen = vi.fn();
    onClose = vi.fn();
    onError = vi.fn();

    // Mock WebSocket globally
    global.WebSocket = vi.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    }) as unknown as typeof WebSocket;

    (global.WebSocket as unknown as typeof MockWebSocket).OPEN = MockWebSocket.OPEN;
    (global.WebSocket as unknown as typeof MockWebSocket).CLOSED = MockWebSocket.CLOSED;
    (global.WebSocket as unknown as typeof MockWebSocket).CONNECTING = MockWebSocket.CONNECTING;
    (global.WebSocket as unknown as typeof MockWebSocket).CLOSING = MockWebSocket.CLOSING;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.WebSocket = OriginalWebSocket;
  });

  describe("connect", () => {
    it("should create WebSocket connection without auth", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
        onOpen,
        onClose,
        onError,
        requireAuth: false,
      };

      const client = new WebSocketClient(config);
      client.connect();

      expect(global.WebSocket).toHaveBeenCalled();
      expect(mockWs.url).toContain("/ws/chat");
      expect(mockWs.url).not.toContain("token=");
    });

    it("should create WebSocket connection with auth token", () => {
      mockGetToken.mockReturnValue("test-token");

      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
        requireAuth: true,
      };

      const client = new WebSocketClient(config);
      client.connect();

      expect(mockWs.url).toContain("token=test-token");
    });

    it("should call onOpen when connection opens", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
        onOpen,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateOpen();

      expect(onOpen).toHaveBeenCalled();
    });

    it("should call onMessage when message received", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateOpen();

      const message: WebSocketMessage = { type: "ready", content: "Connected" };
      mockWs.simulateMessage(message);

      expect(onMessage).toHaveBeenCalledWith(message);
    });

    it("should call onClose when connection closes", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
        onClose,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateClose();

      expect(onClose).toHaveBeenCalled();
    });

    it("should call onError when error occurs", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
        onError,
      };

      const client = new WebSocketClient(config);
      client.connect();

      const errorEvent = new Event("error");
      mockWs.simulateError(errorEvent);

      expect(onError).toHaveBeenCalledWith(errorEvent);
    });
  });

  describe("send", () => {
    it("should send message when connected", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateOpen();

      const data = { type: "message", content: "Hello" };
      client.send(data);

      expect(mockWs.sentMessages).toContain(JSON.stringify(data));
    });

    it("should not send message when disconnected", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);
      client.send({ type: "message" });

      expect(consoleSpy).toHaveBeenCalledWith("WebSocket is not connected");
      consoleSpy.mockRestore();
    });
  });

  describe("disconnect", () => {
    it("should close WebSocket connection", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateOpen();

      client.disconnect();

      expect(mockWs.readyState).toBe(MockWebSocket.CLOSED);
    });
  });

  describe("isConnected", () => {
    it("should return true when connected", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateOpen();

      expect(client.isConnected()).toBe(true);
    });

    it("should return false when disconnected", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);

      expect(client.isConnected()).toBe(false);
    });

    it("should return false after disconnect", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateOpen();
      client.disconnect();

      expect(client.isConnected()).toBe(false);
    });
  });

  describe("reconnection", () => {
    it("should attempt reconnect on close", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
        onClose,
      };

      const client = new WebSocketClient(config);
      client.connect();
      mockWs.simulateClose();

      // First reconnect attempt after delay
      vi.advanceTimersByTime(2000);

      // WebSocket constructor should be called twice (initial + reconnect)
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it("should stop reconnecting after max attempts", () => {
      const config: WebSocketClientConfig = {
        endpoint: "/ws/chat",
        onMessage,
      };

      const client = new WebSocketClient(config);
      client.connect();

      // Simulate 3 close events (max reconnect attempts)
      for (let i = 0; i < 4; i++) {
        mockWs.simulateClose();
        vi.advanceTimersByTime(2000);
      }

      // Should stop at max attempts (3 reconnects + 1 initial = 4 total)
      expect(global.WebSocket).toHaveBeenCalledTimes(4);
    });
  });
});
