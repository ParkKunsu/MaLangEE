import { test, expect } from "@playwright/test";

/**
 * Guest Flow E2E Tests
 *
 * 비회원 사용자의 "바로 대화해보기" 기능을 테스트합니다.
 * API 문서 기반: POST /api/v1/auth/guest-token (게스트 토큰 발급)
 */
test.describe("Guest Conversation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // localStorage 초기화 (로그아웃 상태)
    await page.goto("/auth/login");
    await page.evaluate(() => localStorage.clear());
  });

  test("should navigate to scenario-select when clicking '바로 대화해보기'", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    // 로그인 페이지에서 "바로 대화해보기" 버튼 확인
    const quickStartButton = page.getByRole("button", {
      name: "바로 대화해보기",
    });
    await expect(quickStartButton).toBeVisible();

    // 클릭 후 시나리오 선택 페이지로 이동
    await quickStartButton.click();

    await expect(page).toHaveURL("/auth/scenario-select");
  });

  test("should display scenario-select page correctly", async ({ page }) => {
    await page.goto("/auth/scenario-select");

    // 시나리오 선택 페이지 요소 확인
    await expect(
      page.getByText("어떤 상황을 연습하고 싶은지 편하게 말해보세요")
    ).toBeVisible();
    await expect(page.getByText("마이크를 누르면 바로 시작돼요")).toBeVisible();

    // MalangEE 마스코트 이미지 확인
    await expect(page.getByAltText("MalangEE default")).toBeVisible();
  });

  test("should show microphone button for voice input", async ({ page }) => {
    await page.goto("/auth/scenario-select");

    // 마이크 버튼 확인 (이미지 요소)
    // scenario-select 페이지에는 MalangEE 이미지 외에 마이크 이미지가 있음
    const images = page.locator("img");
    const imageCount = await images.count();

    // 최소 2개 이상의 이미지 (MalangEE + 마이크)
    expect(imageCount).toBeGreaterThanOrEqual(2);
  });

  test("should have login page as entry point", async ({ page }) => {
    // 루트 URL은 로그인 페이지로 리다이렉트
    await page.goto("/");
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL("/auth/login");
  });
});

test.describe("Guest Token Management", () => {
  test("should not have access_token initially in guest mode", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    // localStorage에 토큰이 없어야 함
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    expect(token).toBeNull();
  });
});
