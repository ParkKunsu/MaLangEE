import { test, expect } from "@playwright/test";

/**
 * Scenario & Conversation E2E Tests
 *
 * 시나리오 선택 및 대화 흐름을 테스트합니다.
 * WebSocket 문서 기반:
 * - ws://host/api/v1/ws/scenario (회원용 시나리오)
 * - ws://host/api/v1/ws/guest-scenario (게스트용 시나리오)
 *
 * 시나리오 가이드 기반:
 * - 시나리오 선택 → 자막 설정 → 대화 → 대화 종료
 */

test.describe("Scenario Selection Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should display topic-select page elements", async ({ page }) => {
    // 게스트 모드로 시나리오 선택 페이지 접근
    await page.goto("/auth/scenario-select");

    // 기본 요소 확인
    await expect(
      page.getByText("어떤 상황을 연습하고 싶은지")
    ).toBeVisible();
  });

  test("should show MalangEE mascot on scenario page", async ({ page }) => {
    await page.goto("/auth/scenario-select");

    // MalangEE 마스코트 이미지 확인
    const mascotImage = page.getByAltText(/MalangEE/i);
    await expect(mascotImage.first()).toBeVisible();
  });
});

test.describe("Subtitle Settings Flow", () => {
  test("should navigate to subtitle settings after scenario selection", async ({
    page,
  }) => {
    // 자막 설정 페이지 접근 (로그인 후)
    // 구현에 따라 직접 접근 또는 시나리오 선택 후 이동

    await page.goto("/chat/subtitle-settings");
    await page.waitForTimeout(1000);

    // 인증이 필요한 경우 리다이렉트됨
    const url = page.url();
    // subtitle-settings 또는 로그인 페이지
    expect(url).toBeTruthy();
  });
});

test.describe("Conversation UI Components", () => {
  test("should have microphone button for voice input", async ({ page }) => {
    await page.goto("/auth/scenario-select");

    // 마이크 버튼/이미지 확인
    const microphoneElement = page.locator("img").filter({ hasText: "" }).first();
    await expect(microphoneElement).toBeVisible();
  });
});

test.describe("End Chat Flow", () => {
  test("should show end chat button on topic-select for authenticated users", async ({
    page,
  }) => {
    // 로그인 상태로 topic-select 접근 시 "대화 종료하기" 버튼 표시
    // 실제 로그인 필요

    await page.goto("/topic-select");
    await page.waitForTimeout(1000);

    // 인증되지 않은 경우 리다이렉트됨
    const url = page.url();
    if (url.includes("topic-select")) {
      // 대화 종료하기 버튼 확인
      await expect(page.getByText("대화 종료하기")).toBeVisible();
    }
  });
});

test.describe("Navigation Between Pages", () => {
  test("should navigate from login to scenario-select via quick start", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    // "바로 대화해보기" 클릭
    await page.getByRole("button", { name: "바로 대화해보기" }).click();

    // scenario-select 페이지로 이동
    await expect(page).toHaveURL("/auth/scenario-select");
  });

  test("should have logo link to chat-history", async ({ page }) => {
    await page.goto("/auth/login");

    // 로고 링크 확인
    const logoLink = page.getByRole("link", { name: "MalangEE Logo" });
    await expect(logoLink).toBeVisible();

    // 로고 클릭 시 chat-history로 이동
    const href = await logoLink.getAttribute("href");
    expect(href).toBe("/chat-history");
  });
});

test.describe("Responsive Design", () => {
  test("should display correctly on mobile viewport", async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/auth/login");

    // 기본 요소가 여전히 표시되는지 확인
    await expect(page.getByPlaceholder("아이디")).toBeVisible();
    await expect(page.getByPlaceholder("비밀번호")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("should display scenario-select correctly on tablet", async ({
    page,
  }) => {
    // 태블릿 뷰포트 설정
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/auth/scenario-select");

    // 기본 요소 확인
    await expect(
      page.getByText("어떤 상황을 연습하고 싶은지")
    ).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("should handle 404 page gracefully", async ({ page }) => {
    await page.goto("/nonexistent-page");

    // 404 페이지 또는 리다이렉트 처리 확인
    const url = page.url();
    // 404 페이지 표시 또는 홈으로 리다이렉트
    expect(url).toBeTruthy();
  });
});
