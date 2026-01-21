import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authApi } from "./auth-api";

// Mock dependencies
vi.mock("@/shared/lib/config", () => ({
  config: {
    apiUrl: "http://localhost:8080/api",
  },
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "@/shared/lib/api-client";

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("should send login request with form data", async () => {
      const mockResponse = { access_token: "test-token", token_type: "bearer" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authApi.login("user@test.com", "password123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on 400 response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "Invalid credentials" }),
      });

      await expect(authApi.login("user@test.com", "wrong")).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should handle 422 validation error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            detail: [{ msg: "Field required" }, { msg: "Invalid format" }],
          }),
      });

      await expect(authApi.login("", "")).rejects.toThrow(
        "Field required, Invalid format"
      );
    });

    it("should throw generic error on other failures", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(authApi.login("user@test.com", "pass")).rejects.toThrow(
        "로그인에 실패했습니다"
      );
    });
  });

  describe("register", () => {
    it("should call apiClient.post with correct data", async () => {
      const mockUser = { id: 1, login_id: "test@test.com", nickname: "Test" };
      vi.mocked(apiClient.post).mockResolvedValue(mockUser);

      const data = {
        login_id: "test@test.com",
        nickname: "Test",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = await authApi.register(data);

      expect(apiClient.post).toHaveBeenCalledWith("/auth/signup", {
        login_id: "test@test.com",
        nickname: "Test",
        password: "password123",
        is_active: true,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe("checkLoginId", () => {
    it("should call apiClient.post with login_id", async () => {
      const mockResponse = { is_available: true };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.checkLoginId("test@test.com");

      expect(apiClient.post).toHaveBeenCalledWith("/auth/check-login-id", {
        login_id: "test@test.com",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("checkNickname", () => {
    it("should call apiClient.post with nickname", async () => {
      const mockResponse = { is_available: false };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.checkNickname("TestNick");

      expect(apiClient.post).toHaveBeenCalledWith("/auth/check-nickname", {
        nickname: "TestNick",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getCurrentUser", () => {
    it("should call apiClient.get for /users/me", async () => {
      const mockUser = { id: 1, login_id: "test@test.com", nickname: "Test" };
      vi.mocked(apiClient.get).mockResolvedValue(mockUser);

      const result = await authApi.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith("/users/me");
      expect(result).toEqual(mockUser);
    });
  });

  describe("updateCurrentUser", () => {
    it("should call apiClient.put with update data", async () => {
      const mockUser = { id: 1, login_id: "test@test.com", nickname: "NewNick" };
      vi.mocked(apiClient.put).mockResolvedValue(mockUser);

      const result = await authApi.updateCurrentUser({ nickname: "NewNick" });

      expect(apiClient.put).toHaveBeenCalledWith("/users/me", { nickname: "NewNick" });
      expect(result).toEqual(mockUser);
    });
  });

  describe("deleteCurrentUser", () => {
    it("should call apiClient.delete for /users/me", async () => {
      const mockUser = { id: 1, login_id: "test@test.com", nickname: "Test" };
      vi.mocked(apiClient.delete).mockResolvedValue(mockUser);

      const result = await authApi.deleteCurrentUser();

      expect(apiClient.delete).toHaveBeenCalledWith("/users/me");
      expect(result).toEqual(mockUser);
    });
  });
});
