import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  tokenSchema,
  userSchema,
  checkAvailabilitySchema,
} from "./schema";

describe("Auth Schemas", () => {
  describe("loginSchema", () => {
    it("should validate valid login data (email)", () => {
      const validData = {
        username: "test@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject non-email username", () => {
      const invalidData = {
        username: "testuser",
        password: "password123",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty username", () => {
      const invalidData = {
        username: "",
        password: "password123",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalidData = {
        username: "testuser",
        password: "",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should validate valid registration data (email)", () => {
      const validData = {
        login_id: "test@example.com",
        password: "password123",
        nickname: "테스트",
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject non-email login_id", () => {
      const invalidData = {
        login_id: "testuser",
        password: "password123",
        nickname: "테스트",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject password less than 10 characters", () => {
      const invalidData = {
        login_id: "test@example.com",
        password: "pass123",
        nickname: "테스트",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject password without letters", () => {
      const invalidData = {
        login_id: "test@example.com",
        password: "1234567890",
        nickname: "테스트",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject password without numbers", () => {
      const invalidData = {
        login_id: "test@example.com",
        password: "abcdefghij",
        nickname: "테스트",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty login_id", () => {
      const invalidData = {
        login_id: "",
        password: "password123",
        nickname: "TestNick",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty nickname", () => {
      const invalidData = {
        login_id: "test@example.com",
        password: "password123",
        nickname: "",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("tokenSchema", () => {
    it("should validate valid token response", () => {
      const validToken = {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        token_type: "bearer",
      };
      const result = tokenSchema.safeParse(validToken);
      expect(result.success).toBe(true);
    });

    it("should reject missing access_token", () => {
      const invalidToken = {
        token_type: "bearer",
      };
      const result = tokenSchema.safeParse(invalidToken);
      expect(result.success).toBe(false);
    });
  });

  describe("userSchema", () => {
    it("should validate valid user data", () => {
      const validUser = {
        id: 1,
        login_id: "test@example.com",
        nickname: "TestNick",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("should validate user with null optional fields", () => {
      const validUser = {
        id: 1,
        login_id: "test@example.com",
        nickname: null,
        is_active: null,
        created_at: null,
        updated_at: null,
      };
      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("should validate user with minimal required fields", () => {
      const validUser = {
        id: 1,
        login_id: "test@example.com",
      };
      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });
  });

  describe("checkAvailabilitySchema", () => {
    it("should validate availability response", () => {
      const validResponse = { is_available: true };
      const result = checkAvailabilitySchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should validate unavailable response", () => {
      const validResponse = { is_available: false };
      const result = checkAvailabilitySchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });
});
