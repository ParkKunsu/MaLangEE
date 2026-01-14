import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GuestGuard } from "./GuestGuard";

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

describe("GuestGuard", () => {
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
      <GuestGuard>
        <div>Guest Content</div>
      </GuestGuard>
    );

    // Loading spinner should be shown
    expect(screen.queryByText("Guest Content")).not.toBeInTheDocument();
  });

  it("should render children when no token exists", async () => {
    mockTokenExists.mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithProviders(
      <GuestGuard>
        <div>Guest Content</div>
      </GuestGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Guest Content")).toBeInTheDocument();
    });
  });

  it("should redirect to chat-history when authenticated", async () => {
    mockTokenExists.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, login_id: "testuser" },
    });

    renderWithProviders(
      <GuestGuard>
        <div>Guest Content</div>
      </GuestGuard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/chat-history");
    });
  });

  it("should redirect to custom path when specified", async () => {
    mockTokenExists.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, login_id: "testuser" },
    });

    renderWithProviders(
      <GuestGuard redirectTo="/home">
        <div>Guest Content</div>
      </GuestGuard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/home");
    });
  });
});
