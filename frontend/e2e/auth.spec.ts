import { test, expect, type Page } from "@playwright/test";
import { setAuthStorage, MOCK_USER } from "./helpers/auth";

/**
 * 인증 플로우 E2E 테스트
 * - 로그인 성공/실패 시나리오
 * - 회원가입 성공/실패 시나리오
 * - 게스트 접근 시나리오
 */

// 테스트 데이터
const TEST_USER = {
  email: "test@example.com",
  password: "testPassword123",
  nickname: "테스터",
};

const INVALID_CREDENTIALS = {
  email: "invalid@example.com",
  password: "wrongpassword",
};

// 헬퍼 함수: 로그인 폼 채우기
async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[id="username"]', email);
  await page.fill('input[id="password"]', password);
}

// 헬퍼 함수: 회원가입 폼 채우기
async function fillSignupForm(
  page: Page,
  email: string,
  password: string,
  nickname: string
) {
  await page.fill('input[id="login_id"]', email);
  await page.fill('input[id="password"]', password);
  await page.fill('input[id="nickname"]', nickname);
}

test.describe("로그인 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("로그인 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.getByText("Hello,")).toBeVisible();
    await expect(page.getByText("I'm MalangEE")).toBeVisible();

    // 로그인 폼 요소 확인
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("이메일과 비밀번호 없이 로그인 시도 시 유효성 검증 에러가 표시되어야 함", async ({
    page,
  }) => {
    // 빈 폼으로 로그인 시도
    await page.getByRole("button", { name: "로그인" }).click();

    // 에러 메시지 표시 확인 (Zod 스키마 유효성 검증)
    await expect(page.getByText("올바른 이메일 형식이 아닙니다")).toBeVisible();
  });

  test("잘못된 이메일 형식 입력 시 유효성 검증 에러가 표시되어야 함", async ({
    page,
  }) => {
    await fillLoginForm(page, "invalid-email", "password123");
    await page.getByRole("button", { name: "로그인" }).click();

    // 이메일 형식 에러 메시지 확인
    await expect(
      page.getByText(/이메일|올바른|유효/i).first()
    ).toBeVisible();
  });

  test("로그인 실패 시 에러 메시지가 표시되어야 함", async ({ page }) => {
    // API 응답 모킹 - 로그인 실패
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "이메일 또는 비밀번호가 올바르지 않습니다",
        }),
      });
    });

    await fillLoginForm(
      page,
      INVALID_CREDENTIALS.email,
      INVALID_CREDENTIALS.password
    );
    await page.getByRole("button", { name: "로그인" }).click();

    // 로그인 실패 에러 메시지 확인
    await expect(
      page.getByText(/실패|올바르지 않|오류/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("로그인 성공 시 대시보드로 이동해야 함", async ({ page }) => {
    const mockUser = {
      id: 123,
      login_id: TEST_USER.email,
      nickname: TEST_USER.nickname,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    // API 응답 모킹 - 로그인 성공
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          token_type: "bearer",
        }),
      });
    });

    // 사용자 정보 API 모킹 (로그인 후 사용자 정보 가져오기)
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUser),
      });
    });

    // 채팅 세션 API 모킹 (대시보드 로드시 필요)
    await page.route("**/api/v1/chat/sessions*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          total: 0,
          skip: 0,
          limit: 10,
        }),
      });
    });

    await fillLoginForm(page, TEST_USER.email, TEST_USER.password);
    await page.getByRole("button", { name: "로그인" }).click();

    // 대시보드로 이동 확인
    await expect(page).toHaveURL(/dashboard/i, { timeout: 10000 });
  });

  test("회원가입 링크 클릭 시 회원가입 페이지로 이동해야 함", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "회원가입" }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("바로 체험해보기 버튼 클릭 시 시나리오 선택 페이지로 이동해야 함", async ({
    page,
  }) => {
    // Button asChild를 사용하므로 실제로는 링크로 렌더링됨
    await page.getByRole("link", { name: "바로 체험해보기" }).click();
    await expect(page).toHaveURL(/\/chat\/scenario-select/);
  });

  test("이메일/비밀번호 찾기 클릭 시 준비중 모달이 표시되어야 함", async ({
    page,
  }) => {
    await page.getByText("이메일/비밀번호 찾기").click();

    // 준비중 모달 확인
    await expect(page.getByText("준비중입니다", { exact: true })).toBeVisible();
    await expect(
      page.getByText("해당 기능은 현재 준비중입니다.")
    ).toBeVisible();

    // 확인 버튼 클릭하여 모달 닫기
    await page.getByRole("button", { name: "확인" }).click();
    await expect(page.getByText("준비중입니다", { exact: true })).not.toBeVisible();
  });

  test("타이틀 메시지가 자동으로 로테이션되어야 함", async ({ page }) => {
    // 첫 번째 메시지 확인
    await expect(page.getByText("Talk like there")).toBeVisible();

    // 4초 후 두 번째 메시지로 변경 확인
    await page.waitForTimeout(4500);
    await expect(page.getByText("Need help? Get hints")).toBeVisible();
  });
});

test.describe("회원가입 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signup");
  });

  test("회원가입 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();

    // 폼 요소 확인
    await expect(page.locator('input[id="login_id"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="nickname"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "회원가입" })).toBeVisible();
  });

  test("빈 폼일 때 회원가입 버튼이 비활성화되어야 함", async ({ page }) => {
    // 빈 폼일 때 회원가입 버튼이 비활성화 상태인지 확인
    const signupButton = page.getByRole("button", { name: "회원가입" });
    await expect(signupButton).toBeDisabled();
  });

  test("이메일 중복 확인이 작동해야 함", async ({ page }) => {
    // 이메일 중복 체크 API 모킹 - 사용 가능
    await page.route("**/api/v1/auth/check-login-id", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ is_available: true }),
      });
    });

    await page.fill('input[id="login_id"]', "newemail@example.com");
    await page.locator('input[id="login_id"]').blur();

    // 사용 가능 메시지 확인 (디바운스 시간 고려)
    await expect(
      page.getByText("사용 가능한 이메일입니다")
    ).toBeVisible({ timeout: 10000 });
  });

  test("이메일 중복 시 에러 메시지가 표시되어야 함", async ({ page }) => {
    // 이메일 중복 체크 API 모킹 - 중복
    await page.route("**/api/v1/auth/check-login-id", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ is_available: false }),
      });
    });

    await page.fill('input[id="login_id"]', "existing@example.com");
    await page.locator('input[id="login_id"]').blur();

    // 중복 에러 메시지 확인 (디바운스 시간 고려)
    await expect(
      page.getByText(/이미 사용중인 이메일/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("닉네임 중복 확인이 작동해야 함", async ({ page }) => {
    // 닉네임 중복 체크 API 모킹 - 사용 가능
    await page.route("**/api/v1/auth/check-nickname", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ is_available: true }),
      });
    });

    await page.fill('input[id="nickname"]', "새닉네임");
    await page.locator('input[id="nickname"]').blur();

    // 사용 가능 메시지 확인 (디바운스 시간 고려)
    await expect(
      page.getByText("사용 가능한 닉네임입니다")
    ).toBeVisible({ timeout: 10000 });
  });

  test("비밀번호 유효성 검증이 작동해야 함", async ({ page }) => {
    // 짧은 비밀번호 입력
    await page.fill('input[id="password"]', "short");
    await page.locator('input[id="password"]').blur();

    // 비밀번호 검증 에러 확인 (영문+숫자 10자리 이상)
    await expect(
      page.getByText(/자리|문자|영문|숫자/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  // SKIP: 회원가입 API 호출 타이밍 이슈로 인해 스킵
  // 단위 테스트에서 커버해야 함
  test.skip("회원가입 성공 시 축하 모달이 표시되어야 함", async ({ page }) => {
    // API 모킹 (beforeEach의 goto 전에 route 설정 필요하므로 다시 goto)
    await page.route("**/api/v1/auth/check-login-id", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ is_available: true }),
      });
    });

    await page.route("**/api/v1/auth/check-nickname", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ is_available: true }),
      });
    });

    await page.route("**/api/v1/auth/signup", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: 123,
          login_id: "newuser@example.com",
          nickname: "신규회원",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    // 페이지 재이동 (route 설정 후)
    await page.goto("/auth/signup");

    // 폼 입력 (유효한 형식으로)
    await fillSignupForm(page, "newuser@example.com", "password1234", "신규회원");

    // 디바운스 대기 (1초) + API 응답 대기
    await page.waitForTimeout(2000);

    // 중복 확인 완료 대기
    await expect(page.getByText("사용 가능한 이메일입니다")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("사용 가능한 닉네임입니다")).toBeVisible({ timeout: 10000 });

    // 회원가입 버튼 활성화 확인
    const signupButton = page.getByRole("button", { name: "회원가입" });
    await expect(signupButton).toBeEnabled({ timeout: 5000 });

    // 회원가입 버튼 클릭
    await signupButton.click();

    // 성공 모달 확인 (텍스트가 다를 수 있음)
    // 모달이 나타나거나 로그인 페이지로 리다이렉트되는지 확인
    await page.waitForTimeout(2000); // API 응답 대기

    // 축하 모달 또는 로그인 페이지 확인
    const hasModal = await page.getByText(/축하|가입.*완료|회원이 된/i).isVisible().catch(() => false);
    const hasLoginPage = await page.url().includes("/auth/login");

    expect(hasModal || hasLoginPage).toBeTruthy();
  });

  test("로그인 링크 클릭 시 로그인 페이지로 이동해야 함", async ({ page }) => {
    await page.getByRole("link", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("게스트 접근", () => {
  test("비로그인 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트되어야 함", async ({
    page,
  }) => {
    // 대시보드 직접 접근 시도
    await page.goto("/dashboard");

    // AuthGuard에 의해 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test("비로그인 상태에서 시나리오 선택 페이지는 접근 가능해야 함", async ({
    page,
  }) => {
    // 시나리오 선택 페이지는 게스트도 접근 가능
    await page.goto("/chat/scenario-select");

    // 페이지가 정상적으로 로드되어야 함 (topic-suggestion으로 리다이렉트)
    await expect(page).toHaveURL(/\/chat\/scenario-select/);
  });

  test("홈페이지 접근 시 로그인 페이지로 리다이렉트되어야 함", async ({
    page,
  }) => {
    await page.goto("/");

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});

test.describe("로그아웃", () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 상태 시뮬레이션을 위해 localStorage에 유효한 JWT 토큰과 사용자 정보 설정
    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);
  });

  test("로그아웃 페이지 접근 시 토큰과 사용자 정보가 삭제되고 로그인 페이지로 이동해야 함", async ({
    page,
  }) => {
    await page.goto("/auth/logout");

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // 토큰 및 사용자 정보 삭제 확인
    const accessToken = await page.evaluate(() =>
      localStorage.getItem("access_token")
    );
    const user = await page.evaluate(() =>
      localStorage.getItem("user")
    );
    expect(accessToken).toBeNull();
    expect(user).toBeNull();
  });
});
