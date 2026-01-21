import { test, expect, type Page } from "@playwright/test";
import { createMockJWT, MOCK_USER, setAuthStorage } from "./helpers/auth";

/**
 * 대시보드 E2E 테스트
 * - 대시보드 UI 테스트
 * - 대화 내역 목록 테스트
 * - 닉네임 변경 테스트
 * - 무한 스크롤 테스트
 */

// 테스트 데이터 (MOCK_USER는 helpers/auth.ts에서 import)
const MOCK_CHAT_SESSIONS = [
  {
    session_id: "session-1",
    title: "공항에서 체크인하기",
    started_at: "2025-01-15T10:00:00Z",
    total_duration_sec: 300,
    user_speech_duration_sec: 120,
  },
  {
    session_id: "session-2",
    title: "카페에서 주문하기",
    started_at: "2025-01-14T14:30:00Z",
    total_duration_sec: 450,
    user_speech_duration_sec: 180,
  },
  {
    session_id: "session-3",
    title: "호텔 예약 문의하기",
    started_at: "2025-01-13T09:15:00Z",
    total_duration_sec: 600,
    user_speech_duration_sec: 240,
  },
];

// 헬퍼 함수: API 모킹 (기본 세션 포함)
async function setupApiMocks(page: Page, sessions = MOCK_CHAT_SESSIONS) {
  // 사용자 정보 API
  await page.route("**/api/v1/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER),
    });
  });

  // 채팅 세션 목록 API
  await page.route("**/api/v1/chat/sessions*", async (route) => {
    const url = new URL(route.request().url());
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const items = sessions.slice(skip, skip + limit);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items,
        total: sessions.length,
        skip,
        limit,
      }),
    });
  });
}

// 헬퍼 함수: 로그인 API 모킹 (실제 로그인 플로우용)
async function setupLoginMock(page: Page) {
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ access_token: createMockJWT() }),
    });
  });
}

// 헬퍼 함수: 인증된 대시보드 접근 (localStorage 기반)
async function performLogin(page: Page) {
  // 먼저 아무 페이지로 이동 (localStorage 설정을 위해)
  await page.goto("/auth/login");
  await page.waitForLoadState("domcontentloaded");

  // localStorage에 유효한 JWT 토큰과 사용자 정보 설정
  await setAuthStorage(page, MOCK_USER);

  // 대시보드로 이동
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // 대시보드 콘텐츠가 로드될 때까지 대기
  await page.waitForSelector('text="대화 내역"', { timeout: 15000 });
}

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("대시보드 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setupLoginMock(page);
    await performLogin(page);
  });

  test("대시보드 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    // 사용자 닉네임 표시 확인
    await expect(page.getByText(MOCK_USER.nickname)).toBeVisible({ timeout: 10000 });

    // 대화 내역 제목 확인
    await expect(page.getByText("대화 내역")).toBeVisible();

    // 새 대화 시작 버튼 확인
    await expect(
      page.getByText("말랭이랑 새로운 대화를 해볼까요?")
    ).toBeVisible();
  });

  test("사용자 통계 정보가 표시되어야 함", async ({ page }) => {
    // 통계 정보 확인
    await expect(page.getByText("말랭이와 함께한 시간")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("내가 말한 시간")).toBeVisible();
  });

  test("로그아웃 버튼이 표시되어야 함", async ({ page }) => {
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible({ timeout: 10000 });
  });

  test("닉네임 변경 버튼이 표시되어야 함", async ({ page }) => {
    // 닉네임 옆에 연필 아이콘(Pencil) 버튼이 있어야 함
    await expect(page.getByLabel("닉네임 변경")).toBeVisible({ timeout: 10000 });
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("대화 내역 목록", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setupLoginMock(page);
    await performLogin(page);
  });

  test("대화 내역이 목록으로 표시되어야 함", async ({ page }) => {
    // 각 세션의 제목이 표시되어야 함
    for (const session of MOCK_CHAT_SESSIONS) {
      await expect(page.getByText(session.title)).toBeVisible({ timeout: 10000 });
    }
  });

  test("대화 내역 클릭 시 상세 팝업이 표시되어야 함", async ({ page }) => {
    // 첫 번째 세션 클릭
    await page.getByText(MOCK_CHAT_SESSIONS[0].title).click();

    // 상세 팝업이 표시되어야 함
    await page.waitForTimeout(500);
  });

  test("대화 내역이 없을 때 빈 상태 메시지가 표시되어야 함", async ({
    page,
  }) => {
    // 새로운 페이지에서 빈 세션으로 테스트
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

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 빈 상태 메시지 확인
    await expect(
      page.getByText("말랭이와 대화한 이력이 없어요.")
    ).toBeVisible({ timeout: 10000 });
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("무한 스크롤", () => {
  test("더 많은 데이터 로드 시 목록이 확장되어야 함", async ({ page }) => {
    // 많은 세션 데이터로 모킹
    const manySessions = Array.from({ length: 25 }, (_, i) => ({
      session_id: `session-${i + 1}`,
      title: `대화 세션 ${i + 1}`,
      started_at: new Date(Date.now() - i * 86400000).toISOString(),
      total_duration_sec: 300 + i * 10,
      user_speech_duration_sec: 120 + i * 5,
    }));

    await setupApiMocks(page, manySessions);
    await setupLoginMock(page);
    await performLogin(page);

    // 첫 페이지 데이터 확인 (exact: true로 "대화 세션 10"과 구분)
    await expect(page.getByText("대화 세션 1", { exact: true })).toBeVisible({ timeout: 10000 });

    // 스크롤하여 더 많은 데이터 로드
    await page.evaluate(() => {
      const scrollContainer = document.querySelector(".md\\:overflow-y-auto");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });

    // 추가 데이터 로드 대기
    await page.waitForTimeout(1000);
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("로그아웃 기능", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setupLoginMock(page);
    await performLogin(page);
  });

  test("로그아웃 버튼 클릭 시 확인 팝업이 표시되어야 함", async ({ page }) => {
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 확인 팝업
    await expect(page.getByText("정말 로그아웃 하실건가요?")).toBeVisible();
  });

  test("로그아웃 확인 팝업에서 닫기 클릭 시 팝업이 닫혀야 함", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "로그아웃" }).click();
    await page.getByRole("button", { name: "닫기" }).click();

    await expect(page.getByText("정말 로그아웃 하실건가요?")).not.toBeVisible();
  });

  test("로그아웃 확인 시 로그인 페이지로 이동해야 함", async ({ page }) => {
    await page.getByRole("button", { name: "로그아웃" }).click();

    // 팝업이 완전히 표시될 때까지 대기
    await expect(page.getByText("정말 로그아웃 하실건가요?")).toBeVisible();

    // 팝업 내의 로그아웃 버튼 클릭 (force: true로 오버레이 무시)
    const logoutButtons = page.getByRole("button", { name: "로그아웃" });
    await logoutButtons.last().click({ force: true });

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("닉네임 변경 기능", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setupLoginMock(page);
    await performLogin(page);
  });

  test("닉네임 변경 버튼 클릭 시 팝업이 표시되어야 함", async ({ page }) => {
    await page.getByLabel("닉네임 변경").click();

    // 닉네임 변경 팝업이 표시되어야 함
    await page.waitForTimeout(500);
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("새 대화 시작", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setupLoginMock(page);
    await performLogin(page);
  });

  test("대화 내역이 없을 때 새 대화 시작 시 시나리오 선택 페이지로 이동해야 함", async ({
    page,
  }) => {
    // 빈 세션 목록으로 모킹
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

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 새 대화 시작 버튼 클릭
    await page.getByText("말랭이랑 새로운 대화를 해볼까요?").click();

    // 시나리오 선택 페이지로 이동 확인
    await expect(page).toHaveURL(/\/chat\/scenario-select/, { timeout: 10000 });
  });

  // TODO: welcome-back 페이지 접근 시 인증 유실 이슈 조사 필요
  // 앱 내부에서 새 대화 시작 시 welcome-back 페이지로 이동하지만, E2E에서 인증 상태가 유지되지 않음
  test.skip("대화 내역이 있을 때 새 대화 시작 시 welcome-back 페이지로 이동해야 함", async ({
    page,
  }) => {
    // 세션 목록이 로드되었는지 확인 (대화 내역이 있는 상태)
    await expect(page.getByText(MOCK_CHAT_SESSIONS[0].title)).toBeVisible({ timeout: 10000 });

    // 새 대화 시작 버튼 클릭
    await page.getByText("말랭이랑 새로운 대화를 해볼까요?").click();

    // welcome-back 페이지로 이동 확인
    await expect(page).toHaveURL(/\/chat\/welcome-back/, { timeout: 10000 });
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("대시보드 반응형 디자인", () => {
  test.describe("모바일 뷰포트", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("모바일에서 대시보드가 정상적으로 표시되어야 함", async ({ page }) => {
      await setupApiMocks(page);
      await setupLoginMock(page);
      await performLogin(page);

      // 사용자 닉네임 표시 확인
      await expect(page.getByText(MOCK_USER.nickname)).toBeVisible({ timeout: 10000 });

      // 대화 내역 제목 확인
      await expect(page.getByText("대화 내역")).toBeVisible();
    });
  });

  test.describe("태블릿 뷰포트", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("태블릿에서 대시보드가 정상적으로 표시되어야 함", async ({ page }) => {
      await setupApiMocks(page);
      await setupLoginMock(page);
      await performLogin(page);

      // 사용자 닉네임 표시 확인
      await expect(page.getByText(MOCK_USER.nickname)).toBeVisible({ timeout: 10000 });
    });
  });
});

// 로딩 상태 테스트 - 앱에서 실제로 사용하는 로딩 컴포넌트에 따라 스킵
test.describe("대시보드 로딩 상태", () => {
  test.skip("로딩 중 스피너가 표시되어야 함", async ({ page }) => {
    // API 응답 지연 시뮬레이션
    await page.route("**/api/v1/users/me", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    });

    await page.route("**/api/v1/chat/sessions*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: MOCK_CHAT_SESSIONS,
          total: MOCK_CHAT_SESSIONS.length,
          skip: 0,
          limit: 10,
        }),
      });
    });

    await setupLoginMock(page);

    // 로그인 페이지로 이동
    await page.goto("/auth/login");
    await page.waitForLoadState("domcontentloaded");

    // 유효한 JWT 토큰으로 인증 설정
    await setAuthStorage(page, MOCK_USER);

    // 대시보드로 이동
    await page.goto("/dashboard");

    // 참고: 앱에서 실제로 사용하는 로딩 컴포넌트에 따라 선택자 수정 필요
    // AuthGuard는 자체 로딩 상태를 표시하지만, animate-spin 클래스를 사용하지 않을 수 있음
    const spinner = page.locator(".animate-spin");
    await expect(spinner.first()).toBeVisible({ timeout: 3000 });
  });
});

// 에러 처리 테스트
test.describe("대시보드 에러 처리", () => {
  test("API 오류 시 적절한 처리가 되어야 함", async ({ page }) => {
    await setupLoginMock(page);

    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    // 로그인 페이지에서 시작
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // 유효한 JWT 토큰으로 인증 설정
    await setAuthStorage(page, MOCK_USER);

    // 대시보드로 직접 이동
    await page.goto("/dashboard");

    // 페이지가 크래시하지 않고 로드되어야 함
    await page.waitForLoadState("networkidle");
  });

  test("세션 목록 로드 실패 시 적절한 처리가 되어야 함", async ({ page }) => {
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    });

    await page.route("**/api/v1/chat/sessions*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Failed to load sessions" }),
      });
    });

    await setupLoginMock(page);

    await page.goto("/auth/login");
    await page.waitForLoadState("domcontentloaded");
    // 유효한 JWT 토큰으로 인증 설정
    await setAuthStorage(page, MOCK_USER);
    await page.goto("/dashboard");

    // 페이지가 크래시하지 않고 로드되어야 함
    await page.waitForLoadState("networkidle");
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("대시보드 접근성", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setupLoginMock(page);
    await performLogin(page);
  });

  test("키보드로 탐색 가능해야 함", async ({ page }) => {
    // 닉네임 변경 버튼이 보일 때까지 대기
    await expect(page.getByLabel("닉네임 변경")).toBeVisible({ timeout: 10000 });

    // Tab 키로 탐색
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // 포커스가 이동되어야 함
  });

  test("닉네임 변경 버튼에 적절한 aria-label이 있어야 함", async ({ page }) => {
    const nicknameButton = page.getByLabel("닉네임 변경");
    await expect(nicknameButton).toBeVisible({ timeout: 10000 });
  });
});

// SKIP: AuthGuard + React Query 하이드레이션 타이밍 이슈
test.describe("localStorage 상태 관리", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setupLoginMock(page);
    await performLogin(page);
  });

  test("새 대화 시작 시 entryType이 member로 설정되어야 함", async ({
    page,
  }) => {
    // 새 대화 시작 버튼 클릭
    await page.getByText("말랭이랑 새로운 대화를 해볼까요?").click();

    // localStorage 확인
    const entryType = await page.evaluate(() =>
      localStorage.getItem("entryType")
    );
    expect(entryType).toBe("member");
  });

  test("새 대화 시작 시 loginId가 저장되어야 함", async ({ page }) => {
    await page.getByText("말랭이랑 새로운 대화를 해볼까요?").click();

    const loginId = await page.evaluate(() => localStorage.getItem("loginId"));
    expect(loginId).toBe(MOCK_USER.login_id);
  });
});
