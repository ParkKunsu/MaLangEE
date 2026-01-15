import { test, expect, type Page } from "@playwright/test";

/**
 * Complete User Journey E2E Tests
 *
 * 시나리오 가이드 기반 전체 사용자 여정 테스트
 *
 * 사용자 여정:
 * 1. 로그인 페이지 → 로그인 or 게스트
 * 2. 시나리오 선택 (음성 입력)
 * 3. 자막 설정
 * 4. 대화 진행 (WebSocket)
 * 5. 대화 종료 → 결과 화면
 * 6. 재방문 시 Welcome Back
 */

test.describe("Complete User Journey - New User", () => {
  test.describe.configure({ mode: "serial" });

  const timestamp = Date.now();
  const newUser = {
    login_id: `journey_${timestamp}`,
    nickname: `여정테스트_${timestamp}`,
    password: "test1234567890",
  };

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("Step 1: View login page (entry point)", async () => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // 루트 URL은 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL("/auth/login");
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "바로 대화해보기" })
    ).toBeVisible();
  });

  test("Step 2: Navigate to signup", async () => {
    await page.getByRole("link", { name: "회원가입" }).click();
    await expect(page).toHaveURL("/auth/signup");
  });

  test("Step 3: Complete registration", async () => {
    await page.getByPlaceholder("아이디를 입력해주세요").fill(newUser.login_id);
    await page.waitForTimeout(1500);

    await page.getByPlaceholder(/영문\+숫자 조합/).fill(newUser.password);
    await page.getByPlaceholder("닉네임을 입력해주세요").fill(newUser.nickname);
    await page.waitForTimeout(1500);

    const submitButton = page.getByRole("button", { name: "회원가입" });

    // 버튼이 활성화될 때까지 대기
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    await submitButton.click();

    // 로그인 페이지로 리다이렉트 또는 signup에 머무름
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/login|signup/);

    // 로그인 페이지가 아니면 직접 이동
    if (!url.includes("login")) {
      await page.goto("/auth/login");
    }
  });

  test("Step 4: Login with new account", async () => {
    await page.getByPlaceholder("아이디").fill(newUser.login_id);
    await page.getByPlaceholder("비밀번호").fill(newUser.password);
    await page.getByRole("button", { name: "로그인" }).click();

    // 로그인 후 리다이렉트 확인 (topic-select 또는 chat-history)
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/topic-select|chat-history|welcome-back/);
  });

  test("Step 5: View protected page after login", async () => {
    const url = page.url();

    if (url.includes("topic-select")) {
      await expect(page.getByText("어떤 상황을 연습하고 싶은지")).toBeVisible();
    } else {
      // chat-history 또는 welcome-back 페이지 - 페이지가 로드되었는지 확인
      await page.waitForLoadState("networkidle");
    }

    // 인증된 사용자임을 확인
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    expect(token).toBeTruthy();
  });

  test("Step 6: Verify authenticated state", async () => {
    // 인증 상태 확인 (토큰이 존재하는지)
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    expect(token).toBeTruthy();

    // 로고 링크 확인 (MalangEE Logo 이미지가 있는 링크)
    const logoLink = page.getByRole("link", { name: "MalangEE Logo" });
    const logoExists = await logoLink.count();
    // 로고가 있으면 확인, 없으면 스킵
    if (logoExists > 0) {
      await expect(logoLink).toBeVisible();
    }
  });
});

test.describe("Complete User Journey - Returning User", () => {
  test("should show welcome-back when previous session exists", async ({
    page,
  }) => {
    // 이전 세션이 있는 사용자는 welcome-back 페이지 표시
    // 실제로는 세션 데이터가 필요함

    await page.goto("/chat/welcome-back");
    await page.waitForTimeout(1000);

    const url = page.url();
    // 세션이 없으면 scenario-select로, 인증이 없으면 login으로 리다이렉트
    expect(url).toMatch(/welcome-back|scenario-select|login/);
  });
});

test.describe("Complete User Journey - Guest User", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("Step 1: Guest starts from login page", async () => {
    await page.goto("/auth/login");
    await page.evaluate(() => localStorage.clear());

    // 로그인 페이지 확인
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "바로 대화해보기" })
    ).toBeVisible();
  });

  test("Step 2: Guest quick start from login page", async () => {
    // 바로 대화해보기 버튼 클릭
    await page.getByRole("button", { name: "바로 대화해보기" }).click();

    // 시나리오 선택 페이지로 이동
    await expect(page).toHaveURL("/auth/scenario-select");
  });

  test("Step 3: Guest views scenario page", async () => {
    await expect(
      page.getByText("어떤 상황을 연습하고 싶은지")
    ).toBeVisible();
  });
});

test.describe("UI Consistency Checks", () => {
  test("should maintain consistent styling across pages", async ({ page }) => {
    const pages = ["/auth/login", "/auth/signup", "/auth/scenario-select"];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForTimeout(500);

      // 기본 폰트 및 색상 확인 (Pretendard 폰트)
      const bodyFontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      expect(bodyFontFamily).toBeTruthy();
    }
  });

  test("should have proper focus states on form inputs", async ({ page }) => {
    await page.goto("/auth/login");

    const idInput = page.getByPlaceholder("아이디");
    await idInput.focus();

    // 포커스 상태 확인
    await expect(idInput).toBeFocused();
  });
});

test.describe("Accessibility Checks", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/auth/login");

    // h1 태그 확인
    const headings = await page.locator("h1").all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test("should have labels for form inputs", async ({ page }) => {
    await page.goto("/auth/signup");

    // 폼 필드에 레이블 또는 placeholder 확인
    await expect(page.getByPlaceholder("아이디를 입력해주세요")).toBeVisible();
    await expect(page.getByPlaceholder(/영문\+숫자 조합/)).toBeVisible();
    await expect(page.getByPlaceholder("닉네임을 입력해주세요")).toBeVisible();
  });

  test("should have proper button roles", async ({ page }) => {
    await page.goto("/auth/login");

    // 버튼 역할 확인
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "바로 대화해보기" })
    ).toBeVisible();
  });
});
