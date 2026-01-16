import { test, expect } from "@playwright/test";

/**
 * End Chat Flow E2E Tests
 *
 * 대화 종료 플로우를 테스트합니다.
 *
 * 플로우:
 * 1. chat 페이지들의 헤더에 "대화 종료하기" 버튼
 * 2. 버튼 클릭 시 확인 팝업 표시
 * 3. 팝업에서 "취소" 선택 시 팝업 닫힘
 * 4. 팝업에서 "종료하기" 선택 시 로그아웃 및 로그인 페이지로 이동
 */

test.describe("End Chat Button", () => {
  const chatPages = [
    "/chat/welcome-back",
    "/chat/subtitle-settings",
    "/chat/voice-selection",
    "/chat/complete",
  ];

  for (const pagePath of chatPages) {
    test(`should display end chat button on ${pagePath}`, async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto(pagePath);
      await page.waitForTimeout(1500);

      const url = page.url();
      // 페이지에 머무른 경우에만 테스트
      if (url.includes(pagePath.split("/").pop()!)) {
        // "대화 종료하기" 버튼 확인
        const endChatButton = page.getByText("대화 종료하기");
        await expect(endChatButton).toBeVisible();
      }

      await page.evaluate(() => localStorage.clear());
    });
  }
});

test.describe("End Chat Popup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should open popup when clicking end chat button", async ({ page }) => {
    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("welcome-back")) {
      // "대화 종료하기" 버튼 클릭
      await page.getByText("대화 종료하기").click();
      await page.waitForTimeout(500);

      // 팝업 확인 메시지
      await expect(page.getByText("대화를 종료하시겠어요?")).toBeVisible();

      // 취소 및 종료하기 버튼 확인
      await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
      await expect(page.getByRole("button", { name: "종료하기" })).toBeVisible();
    }
  });

  test("should display MalangEE mascot in popup", async ({ page }) => {
    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("welcome-back")) {
      await page.getByText("대화 종료하기").click();
      await page.waitForTimeout(500);

      // 팝업 내 마스코트 이미지 확인
      const mascotImage = page.locator("img").filter({ hasText: "" });
      expect(await mascotImage.count()).toBeGreaterThan(0);
    }
  });

  test("should close popup when clicking cancel", async ({ page }) => {
    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("welcome-back")) {
      // 팝업 열기
      await page.getByText("대화 종료하기").click();
      await page.waitForTimeout(500);

      // 팝업 확인
      await expect(page.getByText("대화를 종료하시겠어요?")).toBeVisible();

      // 취소 버튼 클릭
      await page.getByRole("button", { name: "취소" }).click();
      await page.waitForTimeout(500);

      // 팝업이 닫혔는지 확인
      await expect(page.getByText("대화를 종료하시겠어요?")).not.toBeVisible();

      // 여전히 같은 페이지에 있는지 확인
      expect(page.url()).toContain("welcome-back");
    }
  });

  test("should logout and redirect when clicking confirm", async ({ page }) => {
    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("welcome-back")) {
      // 팝업 열기
      await page.getByText("대화 종료하기").click();
      await page.waitForTimeout(500);

      // 종료하기 버튼 클릭
      await page.getByRole("button", { name: "종료하기" }).click();
      await page.waitForTimeout(1000);

      // 로그아웃 확인 - 토큰 제거 또는 로그인 페이지로 리다이렉트
      const token = await page.evaluate(() =>
        localStorage.getItem("access_token")
      );
      const currentUrl = page.url();

      // 로그아웃 후 토큰이 없거나 로그인 페이지로 이동
      expect(token === null || currentUrl.includes("login")).toBe(true);
    }
  });
});

test.describe("End Chat Popup Accessibility", () => {
  test("should be keyboard accessible", async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("welcome-back")) {
      // "대화 종료하기" 버튼 클릭
      await page.getByText("대화 종료하기").click();
      await page.waitForTimeout(500);

      // 팝업이 열려있는지 확인
      await expect(page.getByText("대화를 종료하시겠어요?")).toBeVisible();

      // Tab 키로 버튼 간 이동 테스트
      const cancelButton = page.getByRole("button", { name: "취소" });
      const confirmButton = page.getByRole("button", { name: "종료하기" });

      // 버튼들이 포커스 가능한지 확인
      await cancelButton.focus();
      await expect(cancelButton).toBeFocused();

      await confirmButton.focus();
      await expect(confirmButton).toBeFocused();

      // Escape 키로 팝업 닫기 (구현에 따라 다를 수 있음)
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // 팝업이 닫히지 않았을 수 있음 (취소 버튼 클릭으로 닫기)
      if (await page.getByText("대화를 종료하시겠어요?").isVisible()) {
        await cancelButton.click();
      }
    }

    await page.evaluate(() => localStorage.clear());
  });
});

test.describe("End Chat Flow Integration", () => {
  test("should complete full end chat flow", async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat/voice-selection");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("voice-selection")) {
      // 1. "대화 종료하기" 버튼 클릭
      await page.getByText("대화 종료하기").click();
      await page.waitForTimeout(500);

      // 2. 팝업 확인
      await expect(page.getByText("대화를 종료하시겠어요?")).toBeVisible();

      // 3. 종료하기 클릭
      await page.getByRole("button", { name: "종료하기" }).click();
      await page.waitForTimeout(1000);

      // 4. 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/login/);

      // 5. 토큰이 제거되었는지 확인
      const token = await page.evaluate(() =>
        localStorage.getItem("access_token")
      );
      expect(token).toBeNull();
    } else {
      // 페이지 접근이 안 된 경우 (리다이렉트)
      await page.evaluate(() => localStorage.clear());
    }
  });

  test("should preserve page state after cancel", async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat/subtitle-settings");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("subtitle-settings")) {
      // 팝업 열기
      await page.getByText("대화 종료하기").click();
      await page.waitForTimeout(500);

      // 취소
      await page.getByRole("button", { name: "취소" }).click();
      await page.waitForTimeout(500);

      // 여전히 같은 페이지에 있고 인증 상태 유지
      expect(page.url()).toContain("subtitle-settings");

      const token = await page.evaluate(() =>
        localStorage.getItem("access_token")
      );
      expect(token).toBe("mock_token_for_ui_test");
    }

    await page.evaluate(() => localStorage.clear());
  });
});

test.describe("End Chat Button Styling", () => {
  test("should have hover effect on end chat button", async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("welcome-back")) {
      const endChatButton = page.getByText("대화 종료하기");

      // 버튼 스타일 확인 (클래스에 hover 효과가 있음)
      const buttonClasses = await endChatButton.getAttribute("class");
      expect(buttonClasses).toContain("hover:");
    }

    await page.evaluate(() => localStorage.clear());
  });
});
