import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthGuard } from "./AuthGuard";

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock("../hook", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock tokenStorage
const mockTokenExists = vi.fn();
vi.mock("../model", () => ({
  tokenStorage: {
    exists: () => mockTokenExists(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state while checking authentication", () => {
    mockTokenExists.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("로딩 중...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should render children when authenticated", async () => {
    mockTokenExists.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, login_id: "testuser" },
    });

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  it("should redirect to login when no token exists", async () => {
    mockTokenExists.mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithProviders(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("should redirect to custom path when specified and no token", async () => {
    mockTokenExists.mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithProviders(
      <AuthGuard redirectTo="/custom-login">
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/custom-login");
    });
  });

  it("should render custom fallback when provided", () => {
    mockTokenExists.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    renderWithProviders(
      <AuthGuard fallback={<div>Custom Loading...</div>}>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
  });
});
