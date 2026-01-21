import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import {
  useScenarios,
  useScenario,
  useCreateScenario,
  useScenarioAnalytics,
  scenarioKeys,
} from "./scenarios";

// Mock apiClient
vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
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

describe("scenarioKeys", () => {
  it("should generate correct all key", () => {
    expect(scenarioKeys.all).toEqual(["scenarios"]);
  });

  it("should generate correct lists key", () => {
    expect(scenarioKeys.lists()).toEqual(["scenarios", "list"]);
  });

  it("should generate correct detail key", () => {
    expect(scenarioKeys.detail("123")).toEqual(["scenarios", "detail", "123"]);
  });

  it("should generate correct analytics key", () => {
    expect(scenarioKeys.analytics("123")).toEqual(["scenarios", "analytics", "123"]);
  });
});

describe("useScenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch scenarios list", async () => {
    const mockScenarios = [
      { id: "1", title: "Scenario 1", description: "Desc 1" },
      { id: "2", title: "Scenario 2", description: "Desc 2" },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(mockScenarios);

    const { result } = renderHook(() => useScenarios(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith("/scenarios");
    expect(result.current.data).toEqual(mockScenarios);
  });
});

describe("useScenario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch single scenario", async () => {
    const mockScenario = { id: "123", title: "Test Scenario" };
    vi.mocked(apiClient.get).mockResolvedValue(mockScenario);

    const { result } = renderHook(() => useScenario("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith("/scenarios/123");
    expect(result.current.data).toEqual(mockScenario);
  });

  it("should not fetch when id is empty", async () => {
    const { result } = renderHook(() => useScenario(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});

describe("useCreateScenario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create scenario", async () => {
    const newScenario = {
      id: "new-id",
      title: "New Scenario",
      description: "New description",
      place: "Cafe",
      partner: "Friend",
      goal: "Practice conversation",
      level: 1,
      category: "daily",
    };
    vi.mocked(apiClient.post).mockResolvedValue(newScenario);

    const { result } = renderHook(() => useCreateScenario(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newScenario);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/scenarios", newScenario);
  });
});

describe("useScenarioAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch scenario analytics", async () => {
    const mockAnalytics = { wordCount: 100, topWords: ["hello", "world"] };
    vi.mocked(apiClient.get).mockResolvedValue(mockAnalytics);

    const { result } = renderHook(() => useScenarioAnalytics("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledWith("/analytics/scenario/123");
    expect(result.current.data).toEqual(mockAnalytics);
  });

  it("should not fetch when id is empty", async () => {
    const { result } = renderHook(() => useScenarioAnalytics(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
