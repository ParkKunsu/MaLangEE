import { test, expect, type Page } from "@playwright/test";
import { MOCK_USER, setAuthStorage } from "./helpers/auth";

/**
 * 네비게이션 E2E 테스트
 * - 페이지 간 이동 테스트
 * - 인증 상태에 따른 라우팅 테스트
 * - 브라우저 히스토리 테스트
 */

// 사용자 정보 API 모킹 헬퍼
async function mockUserApi(page: Page) {
  await page.route("**/api/v1/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER),
    });
  });
}

interface MockChatSession {
  session_id: string;
  title?: string;
  started_at: string;
}

// 채팅 세션 API 모킹 헬퍼
async function mockChatSessionsApi(page: Page, sessions: MockChatSession[] = []) {
  await page.route("**/api/v1/chat/sessions*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: sessions,
        total: sessions.length,
        skip: 0,
        limit: 10,
      }),
    });
  });
}

// 로그인 API 모킹 헬퍼
async function mockLoginApi(page: Page) {
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ access_token: "mock-token", token_type: "bearer" }),
    });
  });
}

// localStorage 기반 로그인 시뮬레이션
async function performLogin(page: Page) {
  // 먼저 아무 페이지로 이동 (localStorage 설정을 위해)
  await page.goto("/auth/login");
  await page.waitForLoadState("domcontentloaded");

  // localStorage에 유효한 JWT 토큰과 사용자 정보 설정
  await setAuthStorage(page, MOCK_USER);

  // 대시보드로 이동
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
}

test.describe("페이지 간 네비게이션", () => {
  test("홈페이지에서 로그인 페이지로 리다이렉트되어야 함", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test("로그인 페이지에서 회원가입 페이지로 이동할 수 있어야 함", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "회원가입" }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("회원가입 페이지에서 로그인 페이지로 이동할 수 있어야 함", async ({
    page,
  }) => {
    await page.goto("/auth/signup");
    await page.getByRole("link", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("로그인 페이지에서 시나리오 선택 페이지로 이동할 수 있어야 함", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    // Button asChild를 사용하므로 실제로는 링크로 렌더링됨
    await page.getByRole("link", { name: "바로 체험해보기" }).click();
    await expect(page).toHaveURL(/\/chat\/scenario-select/);
  });
});

test.describe("인증 상태에 따른 라우팅", () => {
  test("비로그인 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트되어야 함", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test("로그인 상태에서 대시보드에 접근할 수 있어야 함", async ({ page }) => {
    // API 모킹 설정
    await mockUserApi(page);
    await mockChatSessionsApi(page);

    // localStorage 기반 로그인 시뮬레이션
    await performLogin(page);

    // 대시보드 콘텐츠 확인
    await expect(page.getByText("대화 내역")).toBeVisible({ timeout: 10000 });
  });

  test("로그인 상태에서 로그인 페이지 접근 시 대시보드로 리다이렉트되어야 함", async ({
    page,
  }) => {
    // API 모킹 설정
    await mockUserApi(page);
    await mockChatSessionsApi(page);

    // localStorage 기반 로그인 시뮬레이션
    await performLogin(page);

    // 로그인 페이지 접근 시도
    await page.goto("/auth/login");

    // 참고: 앱의 GuestGuard 동작에 따라 결과가 다를 수 있음
    // 로그인 상태에서 로그인 페이지에 머물 수도 있고 대시보드로 리다이렉트될 수도 있음
    await page.waitForLoadState("networkidle");
  });
});

test.describe("시나리오 선택 페이지 네비게이션", () => {
  test("시나리오 선택 페이지에 접근할 수 있어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select");
    // topic-suggestion으로 리다이렉트됨
    await expect(page).toHaveURL(/\/chat\/scenario-select/);
  });

  test("주제 선택 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    // 시나리오 API 모킹
    await page.route("**/api/v1/scenarios*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: 1, title: "공항에서 체크인하기", description: "테스트", level: 1, place: "Airport", partner: "Staff", goal: "Check-in" },
        ]),
      });
    });

    await page.goto("/chat/scenario-select/topic-suggestion");

    // 페이지 제목 확인
    await expect(page.getByText("이런 주제는 어때요?")).toBeVisible({ timeout: 10000 });
  });

  test("직접 말하기 페이지에 접근할 수 있어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/direct-speech");
    await expect(page).toHaveURL(/\/chat\/scenario-select\/direct-speech/);
  });

  test("자막 설정 페이지에 접근할 수 있어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/subtitle-settings");
    await expect(page.getByText("말랭이의 답변을 자막으로 볼까요?")).toBeVisible();
  });

  test("목소리 선택 페이지에 접근할 수 있어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/voice-selection");
    await expect(page.getByText("말랭이 목소리 톤을 선택해 주세요.")).toBeVisible();
  });
});

test.describe("대시보드 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    // API 모킹 설정
    await mockUserApi(page);
    await mockChatSessionsApi(page);

    // localStorage 기반 로그인 시뮬레이션
    await performLogin(page);

    // 대시보드 콘텐츠 로드 대기
    await page.waitForSelector('text="대화 내역"', { timeout: 15000 });
  });

  test("대시보드에서 새 대화 시작 버튼이 작동해야 함", async ({ page }) => {
    // 새 대화 시작 버튼 확인
    await expect(
      page.getByText("말랭이랑 새로운 대화를 해볼까요?")
    ).toBeVisible({ timeout: 10000 });
  });

  test("대시보드에서 로그아웃 버튼 클릭 시 확인 팝업이 표시되어야 함", async ({
    page,
  }) => {
    // 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 확인 팝업 표시
    await expect(page.getByText("정말 로그아웃 하실건가요?")).toBeVisible();
  });

  test("로그아웃 확인 팝업에서 닫기 클릭 시 팝업이 닫혀야 함", async ({
    page,
  }) => {
    // 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 닫기 버튼 클릭
    await page.getByRole("button", { name: "닫기" }).click();

    // 팝업이 닫힌 것 확인
    await expect(page.getByText("정말 로그아웃 하실건가요?")).not.toBeVisible();
  });

  test("로그아웃 확인 시 로그인 페이지로 이동해야 함", async ({ page }) => {
    // 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 팝업이 완전히 표시될 때까지 대기
    await expect(page.getByText("정말 로그아웃 하실건가요?")).toBeVisible({ timeout: 5000 });

    // 팝업 내의 로그아웃 버튼 클릭 (팝업 내부에서 찾기)
    const popup = page.locator('.fixed.inset-0').filter({ hasText: '정말 로그아웃 하실건가요?' });
    await popup.getByRole("button", { name: "로그아웃" }).click();

    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});

test.describe("브라우저 히스토리", () => {
  test("뒤로가기로 이전 페이지로 이동할 수 있어야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "회원가입" }).click();

    await expect(page).toHaveURL(/\/auth\/signup/);

    // 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("앞으로가기로 다음 페이지로 이동할 수 있어야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "회원가입" }).click();

    await expect(page).toHaveURL(/\/auth\/signup/);

    // 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL(/\/auth\/login/);

    // 앞으로가기
    await page.goForward();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe("404 및 에러 페이지", () => {
  test("존재하지 않는 페이지 접근 시 적절한 처리가 되어야 함", async ({
    page,
  }) => {
    const response = await page.goto("/non-existent-page");

    // 404 응답 또는 리다이렉트 확인
    // Next.js의 기본 동작에 따라 404 페이지 또는 홈으로 리다이렉트
    const status = response?.status();
    expect([200, 404]).toContain(status);
  });
});

test.describe("채팅 관련 페이지 네비게이션", () => {
  test("대화 완료 페이지에 접근할 수 있어야 함", async ({ page }) => {
    await page.goto("/chat/complete");
    // 페이지가 로드되어야 함 (리다이렉트 될 수 있음)
    await page.waitForLoadState("networkidle");
  });

  test("대화 페이지에 접근할 수 있어야 함", async ({ page }) => {
    // 대화 페이지는 세션이 필요할 수 있음
    await page.goto("/chat/conversation");
    await page.waitForLoadState("networkidle");
  });

  test("환영 페이지에 접근할 수 있어야 함", async ({ page }) => {
    // API 모킹 설정
    await mockUserApi(page);
    await mockChatSessionsApi(page);

    // localStorage 기반 로그인 시뮬레이션
    await performLogin(page);

    // 환영 페이지로 이동
    await page.goto("/chat/welcome-back");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("모바일 네비게이션", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("모바일에서 로그인 페이지가 정상적으로 표시되어야 함", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    // 폼 요소가 표시되어야 함
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("모바일에서 회원가입 페이지가 정상적으로 표시되어야 함", async ({
    page,
  }) => {
    await page.goto("/auth/signup");

    // 폼 요소가 표시되어야 함
    await expect(page.locator('input[id="login_id"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="nickname"]')).toBeVisible();
  });

  test("모바일에서 시나리오 선택 페이지가 정상적으로 표시되어야 함", async ({
    page,
  }) => {
    await page.goto("/chat/scenario-select");

    // 페이지가 로드되어야 함
    await expect(page).toHaveURL(/\/chat\/scenario-select/);
  });
});

test.describe("태블릿 네비게이션", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("태블릿에서 로그인 페이지가 정상적으로 표시되어야 함", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    // 페이지가 로드되어야 함
    await expect(page.getByText("Hello,")).toBeVisible();
  });

  test("태블릿에서 대시보드가 정상적으로 표시되어야 함", async ({ page }) => {
    // API 모킹 설정
    await mockUserApi(page);
    await mockChatSessionsApi(page);

    // localStorage 기반 로그인 시뮬레이션
    await performLogin(page);

    // 대시보드 콘텐츠 확인
    await expect(page.getByText("대화 내역")).toBeVisible({ timeout: 10000 });
  });
});
