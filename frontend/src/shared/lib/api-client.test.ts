import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "./api-client";

describe("ApiClient", () => {
  let apiClient: ApiClient;
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Mock window
    Object.defineProperty(global, "window", {
      value: {
        location: {
          origin: "http://localhost:3000",
          pathname: "/",
          href: "http://localhost:3000/",
        },
      },
      writable: true,
    });

    apiClient = new ApiClient({
      baseUrl: "http://localhost:8080/api",
      getToken: () => "test-token",
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.window = originalWindow;
  });

  describe("GET requests", () => {
    it("should make GET request with correct URL", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await apiClient.get("/users");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/users",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should include Authorization header with token", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient.get("/users");

      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer test-token");
    });

    it("should include query params", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient.get("/users", { params: { page: "1", limit: "10" } });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=1"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.any(Object)
      );
    });
  });

  describe("POST requests", () => {
    it("should make POST request with JSON body", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      const data = { name: "Test", email: "test@test.com" };
      await apiClient.post("/users", data);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(data),
        })
      );
    });

    it("should set Content-Type to application/json", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient.post("/users", {});

      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("PUT requests", () => {
    it("should make PUT request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ updated: true }),
      });

      await apiClient.put("/users/1", { name: "Updated" });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/users/1",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  describe("PATCH requests", () => {
    it("should make PATCH request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ patched: true }),
      });

      await apiClient.patch("/users/1", { name: "Patched" });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/users/1",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  describe("DELETE requests", () => {
    it("should make DELETE request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ deleted: true }),
      });

      await apiClient.delete("/users/1");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/users/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should throw error on 400 response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ detail: "Bad request error" }),
      });

      await expect(apiClient.get("/users")).rejects.toThrow("Bad request error");
    });

    it("should throw error on 422 validation error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 422,
        statusText: "Unprocessable Entity",
        json: () =>
          Promise.resolve({
            detail: [{ msg: "Field required" }, { msg: "Invalid email" }],
          }),
      });

      await expect(apiClient.get("/users")).rejects.toThrow(
        "Field required, Invalid email"
      );
    });

    it("should throw generic error for other status codes", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({}),
      });

      await expect(apiClient.get("/users")).rejects.toThrow("HTTP 500:");
    });
  });

  describe("Without token", () => {
    it("should not include Authorization header when no token", async () => {
      const clientWithoutToken = new ApiClient({
        baseUrl: "http://localhost:8080/api",
        getToken: () => null,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await clientWithoutToken.get("/public");

      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get("Authorization")).toBeNull();
    });
  });
});
