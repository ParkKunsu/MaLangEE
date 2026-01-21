import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useDeleteUser } from "./user";

// Mock apiClient
vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    delete: vi.fn(),
  },
}));

// Mock tokenStorage
const mockTokenRemove = vi.fn();
vi.mock("@/features/auth/model", () => ({
  tokenStorage: {
    remove: () => mockTokenRemove(),
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

describe("useDeleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete user and redirect on success", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/users/me");
    expect(mockTokenRemove).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("should handle deletion failure", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/users/me");
    expect(mockTokenRemove).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalledWith("/auth/login");
  });
});
