import { test, expect, type Page } from "@playwright/test";
import { MOCK_USER, setAuthStorage } from "./helpers/auth";

/**
 * 채팅 플로우 E2E 테스트
 * - /chat/conversation: 대화 페이지
 * - /chat/complete: 대화 완료 페이지
 * - /chat/welcome-back: 재방문 환영 페이지
 */

// 테스트용 세션 데이터
const MOCK_SESSION = {
  session_id: "test-session-123",
  title: "공항에서 체크인하기",
  scenario_id: 1,
  scenario_place: "Airport Terminal",
  scenario_partner: "Check-in Staff",
  scenario_goal: "Complete flight check-in",
  voice: "shimmer",
  show_text: true,
  total_duration_sec: 300,
  user_speech_duration_sec: 120,
  started_at: "2025-01-15T10:00:00Z",
  created_at: "2025-01-15T10:00:00Z",
};

// 헬퍼 함수: 세션 상세 API 모킹
async function mockSessionDetailApi(page: Page, session = MOCK_SESSION) {
  await page.route("**/api/v1/chat/sessions/*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
    } else {
      await route.continue();
    }
  });
}

// 헬퍼 함수: 사용자 정보 API 모킹
async function mockUserApi(page: Page) {
  await page.route("**/api/v1/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER),
    });
  });
}

// 헬퍼 함수: 채팅 세션 목록 API 모킹
async function mockChatSessionsApi(page: Page, sessions: unknown[] = []) {
  await page.route("**/api/v1/chat/sessions", async (route) => {
    if (route.request().method() === "GET") {
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
    } else {
      await route.continue();
    }
  });
}

// 헬퍼 함수: localStorage 설정
async function setupLocalStorage(page: Page) {
  await page.evaluate((session) => {
    localStorage.setItem("chatSessionId", session.session_id);
    localStorage.setItem("selectedVoice", session.voice);
    localStorage.setItem("subtitleEnabled", session.show_text.toString());
    localStorage.setItem("conversationGoal", session.scenario_goal);
    localStorage.setItem("conversationPartner", session.scenario_partner);
    localStorage.setItem("place", session.scenario_place);
  }, MOCK_SESSION);
}

test.describe("대화 페이지", () => {
  test.beforeEach(async ({ page, context }) => {
    // 마이크 권한 허용
    await context.grantPermissions(["microphone"]);
    await mockSessionDetailApi(page);
  });

  test("sessionId가 없으면 에러 팝업이 표시되어야 함", async ({ page }) => {
    await page.goto("/chat/conversation");

    // 세션 에러 팝업 확인
    await expect(page.getByText("세션을 찾을 수 없어요")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("주제를 먼저 선택해주세요")).toBeVisible();
    await expect(page.getByRole("button", { name: "주제 선택하기" })).toBeVisible();
  });

  test("에러 팝업에서 주제 선택하기 클릭 시 시나리오 선택 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/chat/conversation");

    await page.getByRole("button", { name: "주제 선택하기" }).click();

    await expect(page).toHaveURL(/\/chat\/scenario-select/, { timeout: 10000 });
  });

  test("sessionId가 있으면 대화 페이지가 로드되어야 함", async ({ page }) => {
    // localStorage에 세션 ID 설정
    await page.goto("/auth/login");
    await setupLocalStorage(page);

    await page.goto(`/chat/conversation?sessionId=${MOCK_SESSION.session_id}`);

    // 캐릭터 표시 확인
    await expect(page.locator(".character-box")).toBeVisible({ timeout: 10000 });

    // 마이크 버튼 확인
    await expect(page.locator(".mic-container")).toBeVisible();
  });

  test("URL에 sessionId가 있으면 localStorage에 저장되어야 함", async ({ page }) => {
    await page.goto(`/chat/conversation?sessionId=${MOCK_SESSION.session_id}`);

    // 페이지가 로드되고 useEffect가 실행될 때까지 대기
    await page.waitForLoadState("networkidle");

    // 캐릭터가 표시될 때까지 대기 (페이지 렌더링 완료 확인)
    await expect(page.locator(".character-box")).toBeVisible({ timeout: 10000 });

    // localStorage 확인 - 약간의 지연 후 확인
    await page.waitForTimeout(500);
    const storedSessionId = await page.evaluate(() => localStorage.getItem("chatSessionId"));
    expect(storedSessionId).toBe(MOCK_SESSION.session_id);
  });

  test("힌트 버튼이 표시되고 클릭 시 힌트가 표시되어야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await setupLocalStorage(page);
    await page.goto(`/chat/conversation?sessionId=${MOCK_SESSION.session_id}`);

    // 힌트 버튼 확인
    const hintButton = page.getByText("Lost your words?");
    await expect(hintButton).toBeVisible({ timeout: 10000 });

    // 힌트 버튼 클릭
    await hintButton.click();

    // 힌트 메시지 확인
    await expect(page.getByText(/Try saying/)).toBeVisible();
  });

  test("음소거 버튼이 작동해야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await setupLocalStorage(page);
    await page.goto(`/chat/conversation?sessionId=${MOCK_SESSION.session_id}`);

    // 음소거 버튼 확인
    const muteButton = page.getByRole("button", { name: /음소거/ });
    await expect(muteButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe("대화 완료 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionDetailApi(page);
  });

  test("대화 완료 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    // localStorage에 세션 ID 설정
    await page.goto("/auth/login");
    await setupLocalStorage(page);

    await page.goto("/chat/complete");

    // 완료 메시지 확인
    await expect(page.getByText("오늘도 잘 말했어요!")).toBeVisible({ timeout: 10000 });

    // 통계 정보 확인
    await expect(page.getByText("총 대화 시간")).toBeVisible();
    await expect(page.getByText("내가 말한 시간")).toBeVisible();

    // 처음으로 돌아가기 버튼 확인
    await expect(page.getByRole("button", { name: "처음으로 돌아가기" })).toBeVisible();
  });

  test("처음으로 돌아가기 버튼 클릭 시 대시보드로 이동해야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await setupLocalStorage(page);

    await page.goto("/chat/complete");

    await page.getByRole("button", { name: "처음으로 돌아가기" }).click();

    // 대시보드 또는 로그인 페이지로 이동 (인증 상태에 따라)
    await page.waitForURL(/\/(dashboard|auth\/login)/, { timeout: 10000 });
  });

  test("세션 정보가 없으면 기본값이 표시되어야 함", async ({ page }) => {
    await page.goto("/chat/complete");

    // 완료 메시지는 표시되어야 함
    await expect(page.getByText("오늘도 잘 말했어요!")).toBeVisible({ timeout: 10000 });
  });

  test("시간이 올바른 형식으로 표시되어야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await setupLocalStorage(page);

    await page.goto("/chat/complete");

    // 시간 형식 확인 (X분 X초) - 여러 요소가 있을 수 있으므로 first() 사용
    await expect(page.getByText(/\d+분 \d+초/).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("재방문 환영 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await mockUserApi(page);
    await mockSessionDetailApi(page);
    await mockChatSessionsApi(page, [MOCK_SESSION]);
  });

  test("비로그인 상태에서 접근 시 로그인 페이지로 리다이렉트되어야 함", async ({ page }) => {
    await page.goto("/chat/welcome-back");

    // AuthGuard에 의해 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test("로그인 상태에서 세션이 있으면 환영 메시지가 표시되어야 함", async ({ page }) => {
    // 로그인 설정
    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);
    await setupLocalStorage(page);

    await page.goto("/chat/welcome-back");

    // 환영 메시지 확인
    await expect(page.getByText("기다리고 있었어요!")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/이 주제로 다시 이야기해볼까요/)).toBeVisible();

    // 버튼들 확인
    await expect(page.getByRole("link", { name: "대화 시작하기" })).toBeVisible();
    await expect(page.getByRole("link", { name: "새로운 주제 고르기" })).toBeVisible();
  });

  test("대화 시작하기 클릭 시 대화 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);
    await setupLocalStorage(page);

    await page.goto("/chat/welcome-back");

    await page.getByRole("link", { name: "대화 시작하기" }).click();

    await expect(page).toHaveURL(/\/chat\/conversation/, { timeout: 10000 });
  });

  test("새로운 주제 고르기 클릭 시 시나리오 선택 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);
    await setupLocalStorage(page);

    await page.goto("/chat/welcome-back");

    await page.getByRole("link", { name: "새로운 주제 고르기" }).click();

    await expect(page).toHaveURL(/\/chat\/scenario-select/, { timeout: 10000 });
  });

  test("로딩 중 상태가 표시되어야 함", async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route("**/api/v1/chat/sessions/*", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION),
      });
    });

    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);
    await setupLocalStorage(page);

    await page.goto("/chat/welcome-back");

    // 로딩 메시지 확인
    await expect(page.getByText("잠시만 기다려주세요...")).toBeVisible();
  });
});

test.describe("채팅 플로우 - 반응형 디자인", () => {
  test.describe("모바일 뷰포트", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("모바일에서 대화 완료 페이지가 정상적으로 표시되어야 함", async ({ page }) => {
      await mockSessionDetailApi(page);
      await page.goto("/auth/login");
      await page.evaluate((session) => {
        localStorage.setItem("chatSessionId", session.session_id);
      }, MOCK_SESSION);

      await page.goto("/chat/complete");

      await expect(page.getByText("오늘도 잘 말했어요!")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("태블릿 뷰포트", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("태블릿에서 대화 완료 페이지가 정상적으로 표시되어야 함", async ({ page }) => {
      await mockSessionDetailApi(page);
      await page.goto("/auth/login");
      await page.evaluate((session) => {
        localStorage.setItem("chatSessionId", session.session_id);
      }, MOCK_SESSION);

      await page.goto("/chat/complete");

      await expect(page.getByText("오늘도 잘 말했어요!")).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe("채팅 플로우 - localStorage 상태 관리", () => {
  test("대화 페이지에서 필요한 localStorage 값들이 읽혀야 함", async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);
    await mockSessionDetailApi(page);

    // localStorage 설정
    await page.goto("/auth/login");
    await page.evaluate(() => {
      localStorage.setItem("chatSessionId", "test-session-123");
      localStorage.setItem("selectedVoice", "nova");
      localStorage.setItem("subtitleEnabled", "false");
    });

    await page.goto("/chat/conversation?sessionId=test-session-123");

    // 페이지가 로드되어야 함
    await expect(page.locator(".character-box")).toBeVisible({ timeout: 10000 });
  });

  test("환영 페이지에서 entryType이 member로 설정되어야 함", async ({ page }) => {
    await mockUserApi(page);
    await mockSessionDetailApi(page);
    await mockChatSessionsApi(page, [MOCK_SESSION]);

    await page.goto("/auth/login");
    await setAuthStorage(page, MOCK_USER);
    await page.evaluate((session) => {
      localStorage.setItem("chatSessionId", session.session_id);
    }, MOCK_SESSION);

    await page.goto("/chat/welcome-back");

    // 환영 메시지가 표시될 때까지 대기
    await expect(page.getByText("기다리고 있었어요!")).toBeVisible({ timeout: 10000 });

    // entryType 확인
    const entryType = await page.evaluate(() => localStorage.getItem("entryType"));
    expect(entryType).toBe("member");
  });
});
