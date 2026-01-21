import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useCurrentUser } from "./use-current-user";

// Mock tokenStorage
const mockExists = vi.fn();
const mockRemove = vi.fn();
vi.mock("../model", () => ({
  tokenStorage: {
    exists: () => mockExists(),
    remove: () => mockRemove(),
  },
}));

// Mock authApi
const mockGetCurrentUser = vi.fn();
vi.mock("./auth-api", () => ({
  authApi: {
    getCurrentUser: () => mockGetCurrentUser(),
  },
}));

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

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not fetch when no token exists", async () => {
    mockExists.mockReturnValue(false);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  it("should fetch user when token exists", async () => {
    mockExists.mockReturnValue(true);
    const mockUser = { id: 1, login_id: "test@test.com", nickname: "TestUser" };
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetCurrentUser).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockUser);
  });

  it("should remove token on 401 error", async () => {
    mockExists.mockReturnValue(true);
    mockGetCurrentUser.mockRejectedValue({ status: 401 });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockRemove).toHaveBeenCalled();
  });

  it("should remove token on 403 error", async () => {
    mockExists.mockReturnValue(true);
    mockGetCurrentUser.mockRejectedValue({ status: 403 });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockRemove).toHaveBeenCalled();
  });

  it("should not remove token on other errors", async () => {
    mockExists.mockReturnValue(true);
    mockGetCurrentUser.mockRejectedValue({ status: 500 });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockRemove).not.toHaveBeenCalled();
  });
});
