import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import {
  useGetChatSessions,
  useGetChatSession,
  useGetRecentSession,
  useCreateChatSession,
  useSyncGuestSession,
  useDeleteChatSession,
  useGetHints,
} from "./use-chat-sessions";

// Mock apiClient
vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "@/shared/lib/api-client";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("useGetChatSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch chat sessions list (array response)", async () => {
    const mockSessions = [
      { id: "1", scenario_place: "Cafe" },
      { id: "2", scenario_place: "Restaurant" },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(mockSessions);

    const { result } = renderHook(() => useGetChatSessions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith("/chat/sessions", {
      params: { skip: "0", limit: "20" },
    });
    expect(result.current.data?.items).toEqual(mockSessions);
  });

  it("should fetch chat sessions list (object response)", async () => {
    const mockResponse = {
      items: [{ id: "1" }, { id: "2" }],
      total: 100,
    };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useGetChatSessions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it("should use custom skip and limit", async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    renderHook(() => useGetChatSessions(10, 50), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/chat/sessions", {
        params: { skip: "10", limit: "50" },
      });
    });
  });

  it("should include userId when provided", async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    renderHook(() => useGetChatSessions(0, 20, 123), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/chat/sessions", {
        params: { skip: "0", limit: "20", user_id: "123" },
      });
    });
  });
});

describe("useGetChatSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch single chat session", async () => {
    const mockSession = { id: "session-123", messages: [] };
    vi.mocked(apiClient.get).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useGetChatSession("session-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith("/chat/sessions/session-123");
    expect(result.current.data).toEqual(mockSession);
  });

  it("should not fetch when sessionId is null", async () => {
    const { result } = renderHook(() => useGetChatSession(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});

describe("useGetRecentSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch recent session", async () => {
    const mockSession = { id: "recent-123" };
    vi.mocked(apiClient.get).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useGetRecentSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith("/chat/recent");
    expect(result.current.data).toEqual(mockSession);
  });
});

describe("useCreateChatSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create chat session", async () => {
    const mockSession = { id: "new-session" };
    vi.mocked(apiClient.post).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useCreateChatSession(), {
      wrapper: createWrapper(),
    });

    const createData = {
      scenario_id: "sc-1",
      scenario_place: "Cafe",
      scenario_partner: "Barista",
      scenario_goal: "Order coffee",
      voice: "en-US",
      show_text: true,
    };

    result.current.mutate(createData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/chat/sessions", createData);
  });
});

describe("useSyncGuestSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sync guest session", async () => {
    const mockResponse = { status: "synced", session_id: "session-123" };
    vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSyncGuestSession(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("session-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.put).toHaveBeenCalledWith("/chat/sessions/session-123/sync");
  });
});

describe("useDeleteChatSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete chat session", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ deleted: true });

    const { result } = renderHook(() => useDeleteChatSession(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("session-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/chat/sessions/session-123");
  });
});

describe("useGetHints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch hints for session", async () => {
    const mockResponse = { hints: ["Hint 1", "Hint 2"], session_id: "session-123" };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useGetHints("session-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith("/chat/hints/session-123");
    expect(result.current.data).toEqual(["Hint 1", "Hint 2"]);
  });

  it("should not fetch when sessionId is null", async () => {
    const { result } = renderHook(() => useGetHints(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
