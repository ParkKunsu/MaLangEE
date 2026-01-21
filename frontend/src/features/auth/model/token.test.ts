import { describe, it, expect, beforeEach, vi } from "vitest";
import { tokenStorage, userStorage } from "./token";

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("set", () => {
    it("should store token in localStorage", () => {
      tokenStorage.set("test-token");
      expect(localStorage.getItem("access_token")).toBe("test-token");
    });
  });

  describe("get", () => {
    it("should return token from localStorage", () => {
      localStorage.setItem("access_token", "stored-token");
      expect(tokenStorage.get()).toBe("stored-token");
    });

    it("should return null when no token exists", () => {
      expect(tokenStorage.get()).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove token from localStorage", () => {
      localStorage.setItem("access_token", "to-remove");
      tokenStorage.remove();
      expect(localStorage.getItem("access_token")).toBeNull();
    });
  });

  describe("exists", () => {
    it("should return true when token exists", () => {
      localStorage.setItem("access_token", "existing-token");
      expect(tokenStorage.exists()).toBe(true);
    });

    it("should return false when no token exists", () => {
      expect(tokenStorage.exists()).toBe(false);
    });
  });
});

describe("userStorage", () => {
  const testUser = {
    id: 1,
    login_id: "testuser",
    nickname: "TestNickname",
    email: "test@example.com",
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("set", () => {
    it("should store user object in localStorage as JSON", () => {
      userStorage.set(testUser);
      expect(localStorage.getItem("user")).toBe(JSON.stringify(testUser));
    });
  });

  describe("get", () => {
    it("should return user object from localStorage", () => {
      localStorage.setItem("user", JSON.stringify(testUser));
      expect(userStorage.get()).toEqual(testUser);
    });

    it("should return null when no user exists", () => {
      expect(userStorage.get()).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      localStorage.setItem("user", "invalid-json");
      expect(userStorage.get()).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove user from localStorage", () => {
      localStorage.setItem("user", JSON.stringify(testUser));
      userStorage.remove();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });

  describe("exists", () => {
    it("should return true when user exists", () => {
      localStorage.setItem("user", JSON.stringify(testUser));
      expect(userStorage.exists()).toBe(true);
    });

    it("should return false when no user exists", () => {
      expect(userStorage.exists()).toBe(false);
    });

    it("should return false for invalid JSON (get returns null)", () => {
      localStorage.setItem("user", "invalid-json");
      expect(userStorage.exists()).toBe(false);
    });
  });
});
