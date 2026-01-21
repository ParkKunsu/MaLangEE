import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import {
  useLogin,
  useRegister,
  useLogout,
  useDeleteAccount,
  useCheckLoginId,
  useCheckNickname,
  useUpdateNickname,
} from "./use-auth-mutation";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock authApi
vi.mock("./auth-api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    checkLoginId: vi.fn(),
    checkNickname: vi.fn(),
    updateCurrentUser: vi.fn(),
    deleteCurrentUser: vi.fn(),
  },
}));

// Mock tokenStorage and userStorage
const mockTokenSet = vi.fn();
const mockTokenRemove = vi.fn();
const mockUserSet = vi.fn();
const mockUserRemove = vi.fn();
vi.mock("../model", () => ({
  tokenStorage: {
    set: (token: string) => mockTokenSet(token),
    remove: () => mockTokenRemove(),
  },
  userStorage: {
    set: (user: unknown) => mockUserSet(user),
    remove: () => mockUserRemove(),
  },
}));

// Mock useSyncGuestSession
vi.mock("@/features/chat/api/use-chat-sessions", () => ({
  useSyncGuestSession: () => ({
    mutate: vi.fn(),
  }),
}));

import { authApi } from "./auth-api";

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

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it("should login and store token", async () => {
    const mockToken = { access_token: "test-token", token_type: "bearer" };
    const mockUser = { id: 1, login_id: "test@test.com" };
    vi.mocked(authApi.login).mockResolvedValue(mockToken);
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser as any);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ username: "test@test.com", password: "password" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.login).toHaveBeenCalledWith("test@test.com", "password");
    expect(mockTokenSet).toHaveBeenCalledWith("test-token");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

describe("useRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register and redirect to login", async () => {
    const mockUser = { id: 1, login_id: "new@test.com" };
    vi.mocked(authApi.register).mockResolvedValue(mockUser as any);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      login_id: "new@test.com",
      nickname: "NewUser",
      password: "Password1!",
      confirmPassword: "Password1!",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should logout and redirect to login", async () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockTokenRemove).toHaveBeenCalled();
    expect(mockUserRemove).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});

describe("useDeleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete account and redirect to login", async () => {
    vi.mocked(authApi.deleteCurrentUser).mockResolvedValue({ id: 1 } as any);

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.deleteCurrentUser).toHaveBeenCalled();
    expect(mockTokenRemove).toHaveBeenCalled();
    expect(mockUserRemove).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});

describe("useCheckLoginId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check login id availability", async () => {
    vi.mocked(authApi.checkLoginId).mockResolvedValue({ is_available: true });

    const { result } = renderHook(() => useCheckLoginId(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("test@test.com");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.checkLoginId).toHaveBeenCalledWith("test@test.com");
    expect(result.current.data?.is_available).toBe(true);
  });
});

describe("useCheckNickname", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check nickname availability", async () => {
    vi.mocked(authApi.checkNickname).mockResolvedValue({ is_available: false });

    const { result } = renderHook(() => useCheckNickname(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("TakenNick");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.checkNickname).toHaveBeenCalledWith("TakenNick");
    expect(result.current.data?.is_available).toBe(false);
  });
});

describe("useUpdateNickname", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update nickname", async () => {
    const updatedUser = { id: 1, nickname: "NewNickname" };
    vi.mocked(authApi.updateCurrentUser).mockResolvedValue(updatedUser as any);

    const { result } = renderHook(() => useUpdateNickname(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ new_nickname: "NewNickname" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(authApi.updateCurrentUser).toHaveBeenCalledWith({ nickname: "NewNickname" });
  });
});
