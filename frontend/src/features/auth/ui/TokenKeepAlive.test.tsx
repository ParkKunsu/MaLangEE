import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { TokenKeepAlive } from "./TokenKeepAlive";

// Mock useAuth
const mockRefreshUser = vi.fn();
const mockLogout = vi.fn();
let mockIsAuthenticated = true;

vi.mock("../hook", () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
    logout: mockLogout,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock tokenStorage
let mockToken: string | null = "valid-token";
vi.mock("../model", () => ({
  tokenStorage: {
    get: () => mockToken,
  },
}));

// Mock jwt utils
let mockIsExpired = false;
let mockIsExpiringSoon = false;
vi.mock("@/shared/lib", () => ({
  debugLog: vi.fn(),
  debugError: vi.fn(),
  isTokenExpired: () => mockIsExpired,
  isTokenExpiringSoon: () => mockIsExpiringSoon,
}));

describe("TokenKeepAlive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockToken = "valid-token";
    mockIsExpired = false;
    mockIsExpiringSoon = false;

    // Mock alert
    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render null (no UI)", () => {
    const { container } = render(<TokenKeepAlive />);
    expect(container.firstChild).toBeNull();
  });

  it("should not check token when not authenticated", () => {
    mockIsAuthenticated = false;

    render(<TokenKeepAlive />);

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(mockRefreshUser).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("should not check token when no token exists", () => {
    mockToken = null;

    render(<TokenKeepAlive />);

    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(mockRefreshUser).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("should logout when token is expired", async () => {
    mockIsExpired = true;

    render(<TokenKeepAlive />);

    expect(global.alert).toHaveBeenCalledWith(
      "로그인 세션이 만료되었습니다. 다시 로그인해주세요."
    );
    expect(mockLogout).toHaveBeenCalled();
  });

  it("should refresh user when token is expiring soon", async () => {
    mockIsExpiringSoon = true;
    mockRefreshUser.mockResolvedValue(undefined);

    render(<TokenKeepAlive />);

    expect(mockRefreshUser).toHaveBeenCalled();
  });

  it("should check token every 5 minutes", async () => {
    mockIsExpiringSoon = true;
    mockRefreshUser.mockResolvedValue(undefined);

    render(<TokenKeepAlive />);

    // Initial check
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);

    // After 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(mockRefreshUser).toHaveBeenCalledTimes(2);

    // After another 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(mockRefreshUser).toHaveBeenCalledTimes(3);
  });

  it("should handle refreshUser error gracefully", async () => {
    mockIsExpiringSoon = true;
    mockRefreshUser.mockRejectedValue(new Error("Refresh failed"));

    // Should not throw
    render(<TokenKeepAlive />);

    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("should clear interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { unmount } = render(<TokenKeepAlive />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
