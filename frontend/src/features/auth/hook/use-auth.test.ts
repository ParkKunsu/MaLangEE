import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

// Mock functions must be declared before vi.mock calls
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockTokenExists = vi.fn();
const mockTokenRemove = vi.fn();
const mockRefetch = vi.fn();
const mockUseCurrentUser = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock tokenStorage
vi.mock("../model", () => ({
  tokenStorage: {
    exists: () => mockTokenExists(),
    remove: () => mockTokenRemove(),
  },
}));

// Mock useCurrentUser
vi.mock("../api", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
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

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockResolvedValue({ data: null });
  });

  it("returns isAuthenticated false when no token exists", () => {
    mockTokenExists.mockReturnValue(false);
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns isLoading true when token exists and loading", () => {
    mockTokenExists.mockReturnValue(true);
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("returns isAuthenticated true when token and user exist", () => {
    mockTokenExists.mockReturnValue(true);
    mockUseCurrentUser.mockReturnValue({
      data: { id: 1, login_id: "testuser" },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 1, login_id: "testuser" });
    expect(result.current.isLoading).toBe(false);
  });

  it("returns isAuthenticated false on 401 error", () => {
    mockTokenExists.mockReturnValue(true);
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { status: 401 },
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it("returns isAuthenticated false on 403 error", () => {
    mockTokenExists.mockReturnValue(true);
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { status: 403 },
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isError).toBe(true);
  });

  it("logout removes token and navigates to login", async () => {
    mockTokenExists.mockReturnValue(true);
    mockUseCurrentUser.mockReturnValue({
      data: { id: 1, login_id: "testuser" },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.logout();
    });

    expect(mockTokenRemove).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("refreshUser calls refetch", async () => {
    mockTokenExists.mockReturnValue(true);
    mockUseCurrentUser.mockReturnValue({
      data: { id: 1, login_id: "testuser" },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("returns isLoading false when no token even if query is loading", () => {
    mockTokenExists.mockReturnValue(false);
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("returns isError false for non-auth errors", () => {
    mockTokenExists.mockReturnValue(true);
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { status: 500 },
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // 500 is not an auth error (401/403)
    expect(result.current.isError).toBe(false);
  });
});
