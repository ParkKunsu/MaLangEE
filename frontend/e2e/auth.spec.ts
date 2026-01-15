import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("should display login page correctly", async ({ page }) => {
    await page.goto("/auth/login");

    // 로그인 페이지 콘텐츠 확인
    await expect(page.getByText("Hello,")).toBeVisible();
    await expect(page.getByPlaceholder("아이디")).toBeVisible();
    await expect(page.getByPlaceholder("비밀번호")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(page.getByText("회원가입")).toBeVisible();
  });

  test("should display signup page correctly", async ({ page }) => {
    await page.goto("/auth/signup");

    // 회원가입 페이지 콘텐츠 확인
    await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();
    await expect(page.getByPlaceholder("아이디를 입력해주세요")).toBeVisible();
    await expect(page.getByPlaceholder(/영문\+숫자 조합/)).toBeVisible();
    await expect(page.getByPlaceholder("닉네임을 입력해주세요")).toBeVisible();
    await expect(page.getByRole("button", { name: "회원가입" })).toBeVisible();
  });

  test("should navigate from login to signup", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByRole("link", { name: "회원가입" }).click();

    await expect(page).toHaveURL("/auth/signup");
    await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();
  });

  test("should enable login button when both fields are filled", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    const loginButton = page.getByRole("button", { name: "로그인" });

    // 아이디만 입력
    await page.getByPlaceholder("아이디").fill("testuser");

    // 비밀번호도 입력하면 버튼으로 로그인 가능
    await page.getByPlaceholder("비밀번호").fill("password123");

    // 버튼이 클릭 가능한 상태인지 확인
    await expect(loginButton).toBeEnabled();
  });

  test("should show validation errors on signup form", async ({ page }) => {
    await page.goto("/auth/signup");

    const submitButton = page.getByRole("button", { name: "회원가입" });

    // 초기 상태: 버튼 비활성화
    await expect(submitButton).toBeDisabled();

    // 아이디만 입력
    await page.getByPlaceholder("아이디를 입력해주세요").fill("testuser");
    await page.waitForTimeout(600); // 디바운스 대기
    await expect(submitButton).toBeDisabled();

    // 비밀번호 입력
    await page.getByPlaceholder(/영문\+숫자 조합/).fill("test12345");
    await expect(submitButton).toBeDisabled();

    // 닉네임도 입력
    await page.getByPlaceholder("닉네임을 입력해주세요").fill("테스트닉네임");
    await page.waitForTimeout(600); // 디바운스 대기

    // 중복체크 결과에 따라 버튼 상태 결정됨
  });
});

test.describe("Entry Point", () => {
  test("should redirect root to login page", async ({ page }) => {
    await page.goto("/");

    // 루트 URL은 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL("/auth/login");
  });

  test("should display login page elements on root access", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // 로그인 페이지 요소 확인
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "바로 대화해보기" })
    ).toBeVisible();
  });
});
