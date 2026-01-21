import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

// Mock functions must be declared before vi.mock calls
const mockPush = vi.fn();
const mockTokenExists = vi.fn();
const mockTokenRemove = vi.fn();
const mockUserStorageGet = vi.fn();
const mockUserStorageSet = vi.fn();
const mockUserStorageRemove = vi.fn();
const mockGetCurrentUser = vi.fn();
const mockQueryClientClear = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock tokenStorage and userStorage
vi.mock("../model", () => ({
  tokenStorage: {
    exists: () => mockTokenExists(),
    remove: () => mockTokenRemove(),
  },
  userStorage: {
    get: () => mockUserStorageGet(),
    set: (user: unknown) => mockUserStorageSet(user),
    remove: () => mockUserStorageRemove(),
  },
}));

// Mock authApi
vi.mock("../api/auth-api", () => ({
  authApi: {
    getCurrentUser: () => mockGetCurrentUser(),
  },
}));

// Import after mocks
import { useAuth } from "./use-auth";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock the clear method
  queryClient.clear = mockQueryClientClear;

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokenExists.mockReturnValue(false);
    mockUserStorageGet.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns isAuthenticated false when no token exists", () => {
    mockTokenExists.mockReturnValue(false);
    mockUserStorageGet.mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("returns isAuthenticated false when token exists but no user", () => {
    mockTokenExists.mockReturnValue(true);
    mockUserStorageGet.mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("returns isAuthenticated true when token and user exist", () => {
    mockTokenExists.mockReturnValue(true);
    mockUserStorageGet.mockReturnValue({ id: 1, login_id: "testuser" });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 1, login_id: "testuser" });
    expect(result.current.isLoading).toBe(false);
  });

  it("logout removes token and user, clears query client, and navigates to login", () => {
    mockTokenExists.mockReturnValue(true);
    mockUserStorageGet.mockReturnValue({ id: 1, login_id: "testuser" });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.logout();
    });

    expect(mockTokenRemove).toHaveBeenCalled();
    expect(mockUserStorageRemove).toHaveBeenCalled();
    expect(mockQueryClientClear).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("refreshUser fetches and stores user data", async () => {
    const mockUser = { id: 1, login_id: "testuser", nickname: "Test" };
    mockTokenExists.mockReturnValue(true);
    mockUserStorageGet.mockReturnValue(mockUser);
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    let refreshResult;
    await act(async () => {
      refreshResult = await result.current.refreshUser();
    });

    expect(mockGetCurrentUser).toHaveBeenCalled();
    expect(mockUserStorageSet).toHaveBeenCalledWith(mockUser);
    expect(refreshResult).toEqual({ data: mockUser });
  });

  it("refreshUser removes token and user on error", async () => {
    const mockError = new Error("Auth failed");
    mockTokenExists.mockReturnValue(true);
    mockUserStorageGet.mockReturnValue({ id: 1, login_id: "testuser" });
    mockGetCurrentUser.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.refreshUser();
      } catch (error) {
        // Expected error
        expect((error as Error).message).toBe("Auth failed");
      }
    });

    expect(mockTokenRemove).toHaveBeenCalled();
    expect(mockUserStorageRemove).toHaveBeenCalled();
  });

  it("returns isLoading false always (localStorage based)", () => {
    mockTokenExists.mockReturnValue(true);
    mockUserStorageGet.mockReturnValue({ id: 1, login_id: "testuser" });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // localStorage 기반이므로 항상 isLoading은 false
    expect(result.current.isLoading).toBe(false);
  });

  it("returns isError false always (no error state in localStorage)", () => {
    mockTokenExists.mockReturnValue(true);
    mockUserStorageGet.mockReturnValue({ id: 1, login_id: "testuser" });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // localStorage 기반이므로 항상 isError는 false
    expect(result.current.isError).toBe(false);
  });
});
