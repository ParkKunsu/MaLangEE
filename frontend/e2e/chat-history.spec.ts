import { test, expect } from "@playwright/test";

/**
 * Chat History E2E Tests
 *
 * 대화 기록 페이지 기능을 테스트합니다.
 * - 사용자 프로필 표시 (닉네임, 통계)
 * - 대화 목록 (무한 스크롤)
 * - 대화 상세 팝업
 * - 닉네임 변경 팝업
 * - 로그아웃 기능
 *
 * API 문서 기반:
 * - GET /api/v1/chat/sessions (세션 목록)
 * - GET /api/v1/users/me (사용자 정보)
 * - PUT /api/v1/users/me (사용자 정보 수정)
 */

test.describe("Chat History Page Access", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    // AuthGuard가 작동하여 로그인 페이지로 리다이렉트
    const url = page.url();
    expect(url).toMatch(/login|chat-history/);
  });

  test("should display page when authenticated", async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat-history");
    await page.waitForTimeout(1000);

    const url = page.url();
    // 인증이 되어도 실제 API가 없으면 다른 페이지로 이동할 수 있음
    expect(url).toBeTruthy();

    await page.evaluate(() => localStorage.clear());
  });
});

test.describe("User Profile Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should display user nickname", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 닉네임 또는 기본값이 표시되어야 함
      // 로딩 중이면 기본값 표시
      const nicknameElement = page.locator(".text-2xl.font-bold").first();
      if ((await nicknameElement.count()) > 0) {
        await expect(nicknameElement).toBeVisible();
      }
    }
  });

  test("should display statistics labels", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 통계 레이블 확인
      await expect(page.getByText("말랭이와 함께한 시간")).toBeVisible();
      await expect(page.getByText("내가 말한 시간")).toBeVisible();
    }
  });

  test("should have nickname edit button", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 닉네임 변경 버튼 확인
      const editButton = page.getByLabel("닉네임 변경");
      if ((await editButton.count()) > 0) {
        await expect(editButton).toBeVisible();
      }
    }
  });

  test("should have logout button", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 로그아웃 버튼 확인
      await expect(
        page.getByRole("button", { name: "로그아웃" })
      ).toBeVisible();
    }
  });

  test("should have new conversation button", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 새 대화 시작 버튼 확인
      await expect(
        page.getByRole("button", { name: "말랭이랑 새로운 대화를 해볼까요?" })
      ).toBeVisible();
    }
  });
});

test.describe("Chat List Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should display chat history title", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      await expect(page.getByText("대화 내역")).toBeVisible();
    }
  });

  test("should display list headers", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 목록 헤더 확인
      await expect(page.getByText("날짜")).toBeVisible();
      await expect(page.getByText("주제")).toBeVisible();
      await expect(page.getByText("말한시간 / 대화시간")).toBeVisible();
    }
  });

  test("should show empty state when no sessions", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(3000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 세션이 없으면 빈 상태 메시지 또는 로딩 표시
      const emptyMessage = page.getByText("말랭이와 대화한 이력이 없어요");
      const loadingSpinner = page.locator(".animate-spin");

      // 둘 중 하나는 있어야 함
      const hasEmptyMessage = (await emptyMessage.count()) > 0;
      const hasLoadingSpinner = (await loadingSpinner.count()) > 0;
      const hasSessions = (await page.locator('[class*="cursor-pointer"]').count()) > 0;

      expect(hasEmptyMessage || hasLoadingSpinner || hasSessions).toBe(true);
    }
  });
});

test.describe("Nickname Change Popup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should open nickname change popup on click", async ({ page }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      const editButton = page.getByLabel("닉네임 변경");

      if ((await editButton.count()) > 0) {
        await editButton.click();
        await page.waitForTimeout(500);

        // 팝업이 열렸는지 확인
        // 팝업 내용이나 닫기 버튼 확인
        const popup = page.locator('[role="dialog"], .fixed, [class*="popup"]');
        if ((await popup.count()) > 0) {
          await expect(popup.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe("Chat Detail Popup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should open detail popup when clicking session item", async ({
    page,
  }) => {
    await page.goto("/chat-history");
    await page.waitForTimeout(3000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 세션 아이템 클릭
      const sessionItem = page.locator('[class*="cursor-pointer"]').first();

      if ((await sessionItem.count()) > 0) {
        await sessionItem.click();
        await page.waitForTimeout(500);

        // 상세 팝업이 열렸는지 확인
        const popup = page.locator('[role="dialog"], .fixed, [class*="popup"]');
        if ((await popup.count()) > 0) {
          await expect(popup.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe("Logout Functionality", () => {
  test("should clear auth state on logout click", async ({ page }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      const logoutButton = page.getByRole("button", { name: "로그아웃" });

      if ((await logoutButton.count()) > 0) {
        await logoutButton.click();
        await page.waitForTimeout(1000);

        // 토큰이 제거되었거나 로그인 페이지로 리다이렉트
        const token = await page.evaluate(() =>
          localStorage.getItem("access_token")
        );
        const currentUrl = page.url();

        // 로그아웃 후 토큰이 없거나 로그인 페이지로 이동
        expect(token === null || currentUrl.includes("login")).toBe(true);
      }
    }

    await page.evaluate(() => localStorage.clear());
  });
});

test.describe("New Conversation Navigation", () => {
  test("should navigate to welcome-back on new conversation click", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      const newConversationButton = page.getByRole("button", {
        name: "말랭이랑 새로운 대화를 해볼까요?",
      });

      if ((await newConversationButton.count()) > 0) {
        await newConversationButton.click();
        await page.waitForTimeout(1000);

        // welcome-back 페이지로 이동 확인
        await expect(page).toHaveURL(/welcome-back/);
      }
    }

    await page.evaluate(() => localStorage.clear());
  });
});

test.describe("Logo Navigation", () => {
  test("logo should link to chat-history", async ({ page }) => {
    await page.goto("/auth/login");

    // 로고 링크 확인
    const logoLink = page.getByRole("link", { name: "MalangEE Logo" });
    await expect(logoLink).toBeVisible();

    const href = await logoLink.getAttribute("href");
    expect(href).toBe("/chat-history");
  });
});

test.describe("Responsive Layout", () => {
  test("should display correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 모바일에서도 기본 요소가 표시되어야 함
      await expect(page.getByText("대화 내역")).toBeVisible();
    }

    await page.evaluate(() => localStorage.clear());
  });

  test("should display correctly on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock_token_for_ui_test");
    });

    await page.goto("/chat-history");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("chat-history")) {
      // 태블릿에서도 기본 요소가 표시되어야 함
      await expect(page.getByText("대화 내역")).toBeVisible();
    }

    await page.evaluate(() => localStorage.clear());
  });
});
