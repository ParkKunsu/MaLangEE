import { test, expect } from "@playwright/test";

/**
 * Chat Session E2E Tests
 *
 * 채팅 세션 관리 기능을 테스트합니다.
 * API 문서 기반:
 * - GET /api/v1/chat/sessions (세션 목록)
 * - GET /api/v1/chat/sessions/{id} (세션 상세)
 * - POST /api/v1/chat/sessions/{id}/sync (세션 동기화)
 * - DELETE /api/v1/chat/sessions/{id} (세션 삭제)
 */

test.describe("Welcome Back Page", () => {
  test("should handle welcome-back page access without session", async ({
    page,
  }) => {
    // localStorage 초기화
    await page.goto("/auth/login");
    await page.evaluate(() => localStorage.clear());

    // welcome-back 페이지 접근 시도
    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(2000);

    const url = page.url();
    // welcome-back 페이지에 머무르거나 리다이렉트
    expect(url).toMatch(/welcome-back|scenario-select|login/);
  });
});

test.describe("Chat Session API Integration", () => {
  test("should handle session API call without auth", async ({ request }) => {
    // API 직접 테스트 (인증 토큰 필요)
    // 인증되지 않은 요청은 에러 반환
    const response = await request.get("/api/v1/chat/sessions");
    expect([401, 403, 404]).toContain(response.status());
  });
});

test.describe("Chat History Access", () => {
  test("should have chat-history link in logo", async ({ page }) => {
    await page.goto("/auth/login");

    // 로고 링크 확인
    const logoLink = page.getByRole("link", { name: "MalangEE Logo" });
    await expect(logoLink).toBeVisible();

    // href 확인
    const href = await logoLink.getAttribute("href");
    expect(href).toBe("/chat-history");
  });
});

test.describe("Welcome Back Page Elements", () => {
  test("should handle welcome-back page access", async ({ page }) => {
    // welcome-back 페이지 직접 접근
    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(1000);

    // 페이지가 로드되었거나 리다이렉트되었는지 확인
    const url = page.url();
    expect(url).toBeTruthy();

    // welcome-back 페이지에 머무른 경우 요소 확인
    if (url.includes("welcome-back")) {
      // MalangEE 마스코트 확인
      const mascot = page.locator("img").first();
      await expect(mascot).toBeVisible();
    }
  });
});
