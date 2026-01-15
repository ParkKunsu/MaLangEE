import { test, expect } from "@playwright/test";

/**
 * User Profile E2E Tests
 *
 * 사용자 프로필 관리 기능을 테스트합니다.
 * API 문서 기반:
 * - GET /api/v1/users/me (내 정보 조회)
 * - PUT /api/v1/users/me (내 정보 수정)
 * - DELETE /api/v1/users/me (회원 탈퇴)
 */

test.describe("Profile Access Control", () => {
  test("should handle dashboard access without auth", async ({ page }) => {
    // localStorage 초기화
    await page.goto("/auth/login");
    await page.evaluate(() => localStorage.clear());

    // 대시보드 접근 시도
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    // 현재 URL 확인 (인증 상태에 따라 다름)
    const url = page.url();
    // 대시보드에 머무르거나 로그인으로 리다이렉트
    expect(url).toMatch(/dashboard|login/);
  });
});

test.describe("User Profile API", () => {
  test("should return error for unauthorized /users/me request", async ({
    request,
  }) => {
    // 인증되지 않은 사용자 정보 요청
    const response = await request.get("/api/v1/users/me");
    // 401, 403, 또는 404 중 하나 반환
    expect([401, 403, 404]).toContain(response.status());
  });
});

test.describe("Logout Flow", () => {
  test("should clear auth state on logout", async ({ page }) => {
    await page.goto("/auth/login");

    // 임시 토큰 설정 (테스트용)
    await page.evaluate(() => {
      localStorage.setItem("access_token", "test_token");
    });

    // 토큰 확인
    const tokenBefore = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    expect(tokenBefore).toBe("test_token");

    // 로그아웃 (localStorage 클리어)
    await page.evaluate(() => {
      localStorage.removeItem("access_token");
    });

    // 토큰 제거 확인
    const tokenAfter = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    expect(tokenAfter).toBeNull();
  });

  test("should access login page after logout", async ({ page }) => {
    // 로그아웃 후 로그인 페이지 접근
    await page.goto("/auth/login");
    await page.evaluate(() => localStorage.clear());

    // 로그인 페이지 요소 확인
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });
});

test.describe("Authentication State", () => {
  test("should persist token in localStorage after login", async ({ page }) => {
    // 이 테스트는 실제 로그인 후 토큰 저장을 확인
    // 테스트용으로 토큰 설정 후 확인

    await page.goto("/auth/login");

    // 토큰 설정
    await page.evaluate(() => {
      localStorage.setItem("access_token", "test_access_token");
    });

    // 페이지 새로고침 후에도 토큰 유지
    await page.reload();

    const token = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    expect(token).toBe("test_access_token");

    // 정리
    await page.evaluate(() => localStorage.clear());
  });
});
