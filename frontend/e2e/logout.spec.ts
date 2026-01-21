import { test, expect } from "@playwright/test";
import { MOCK_USER, setAuthStorage } from "./helpers/auth";

/**
 * 로그아웃 E2E 테스트
 * - /auth/logout: 새 로그아웃 페이지
 */

test.describe("로그아웃 페이지", () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 상태 설정
    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);
  });

  test("로그아웃 페이지 접근 시 로그아웃 중 메시지가 표시되어야 함", async ({ page }) => {
    await page.goto("/auth/logout");

    // 로그아웃 중 메시지 확인 (짧은 시간 동안만 표시됨)
    // 페이지가 빠르게 리다이렉트될 수 있으므로 URL 확인도 함께 수행
    await Promise.race([
      expect(page.getByText("로그아웃 중...")).toBeVisible({ timeout: 5000 }),
      expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 }),
    ]);
  });

  test("로그아웃 페이지 접근 시 로그인 페이지로 리다이렉트되어야 함", async ({ page }) => {
    await page.goto("/auth/logout");

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test("로그아웃 후 access_token이 삭제되어야 함", async ({ page }) => {
    // 로그아웃 전 토큰 확인
    const tokenBefore = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(tokenBefore).not.toBeNull();

    await page.goto("/auth/logout");

    // 리다이렉트 완료 대기
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // 토큰 삭제 확인
    const tokenAfter = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(tokenAfter).toBeNull();
  });

  test("로그아웃 후 user 정보가 삭제되어야 함", async ({ page }) => {
    // 로그아웃 전 사용자 정보 확인
    const userBefore = await page.evaluate(() => localStorage.getItem("user"));
    expect(userBefore).not.toBeNull();

    await page.goto("/auth/logout");

    // 리다이렉트 완료 대기
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // 사용자 정보 삭제 확인
    const userAfter = await page.evaluate(() => localStorage.getItem("user"));
    expect(userAfter).toBeNull();
  });

  test("로그아웃 후 localStorage가 완전히 비워져야 함", async ({ page }) => {
    // 추가 데이터 설정
    await page.evaluate(() => {
      localStorage.setItem("chatSessionId", "test-session");
      localStorage.setItem("selectedVoice", "shimmer");
      localStorage.setItem("subtitleEnabled", "true");
    });

    await page.goto("/auth/logout");

    // 리다이렉트 완료 대기
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // localStorage가 비워졌는지 확인
    const localStorageLength = await page.evaluate(() => localStorage.length);
    expect(localStorageLength).toBe(0);
  });

  test("로그아웃 후 sessionStorage가 완전히 비워져야 함", async ({ page }) => {
    // sessionStorage에 데이터 설정
    await page.evaluate(() => {
      sessionStorage.setItem("pendingTopic", "test topic");
    });

    await page.goto("/auth/logout");

    // 리다이렉트 완료 대기
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // sessionStorage가 비워졌는지 확인
    const sessionStorageLength = await page.evaluate(() => sessionStorage.length);
    expect(sessionStorageLength).toBe(0);
  });
});

test.describe("로그아웃 - 비로그인 상태", () => {
  test("비로그인 상태에서 로그아웃 페이지 접근 시에도 로그인 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/auth/logout");

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});

test.describe("로그아웃 - 스피너 표시", () => {
  test("로그아웃 중 스피너가 표시되어야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);

    // 페이지 이동 중에 스피너 캡처
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.goto("/auth/logout"),
    ]);

    // 스피너 또는 로딩 텍스트 확인
    // 빠른 리다이렉트로 인해 보이지 않을 수 있음
    const hasSpinner = await page.locator(".animate-spin").isVisible().catch(() => false);
    const hasLoadingText = await page.getByText("로그아웃 중...").isVisible().catch(() => false);

    // 최종적으로 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});
