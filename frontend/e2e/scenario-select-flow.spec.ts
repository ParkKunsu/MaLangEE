import { test, expect, type Page } from "@playwright/test";
import { MOCK_USER, setAuthStorage } from "./helpers/auth";

/**
 * 시나리오 선택 플로우 E2E 테스트 (새 URL 구조)
 * - /chat/scenario-select/topic-suggestion: 주제 선택
 * - /chat/scenario-select/direct-speech: 직접 말하기
 * - /chat/scenario-select/subtitle-settings: 자막 설정
 * - /chat/scenario-select/voice-selection: 목소리 선택
 */

// 시나리오 목록 모킹 데이터
const MOCK_SCENARIOS = [
  {
    id: 1,
    title: "공항에서 체크인하기",
    description: "공항에서 체크인 카운터 직원과 대화해보세요",
    level: 1,
    place: "Airport Terminal",
    partner: "Check-in Staff",
    goal: "Complete flight check-in",
  },
  {
    id: 2,
    title: "카페에서 주문하기",
    description: "카페에서 음료를 주문해보세요",
    level: 1,
    place: "Coffee Shop",
    partner: "Barista",
    goal: "Order a coffee",
  },
  {
    id: 3,
    title: "호텔 체크인하기",
    description: "호텔 프론트에서 체크인해보세요",
    level: 2,
    place: "Hotel Lobby",
    partner: "Receptionist",
    goal: "Check in to your room",
  },
];

// 헬퍼 함수: 시나리오 API 모킹
async function mockScenarioApi(page: Page, scenarios = MOCK_SCENARIOS) {
  await page.route("**/api/v1/scenarios*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenarios),
    });
  });
}

// 헬퍼 함수: 채팅 세션 생성 API 모킹
async function mockCreateSessionApi(page: Page) {
  await page.route("**/api/v1/chat/sessions", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          session_id: "mock-session-123",
          scenario_id: 1,
          created_at: new Date().toISOString(),
        }),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe("시나리오 선택 - 주제 선택 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await mockScenarioApi(page);
  });

  test("주제 선택 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 페이지 제목 확인
    await expect(page.getByText("이런 주제는 어때요?")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("요즘 인기 있는 주제들 중에서 골라볼까요?")).toBeVisible();

    // 캐릭터 표시 확인
    await expect(page.locator(".character-box")).toBeVisible();
  });

  test("시나리오 목록이 표시되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 시나리오 버튼들 확인 (일부만 표시될 수 있음)
    await page.waitForLoadState("networkidle");

    // 최소 하나의 시나리오 버튼이 표시되어야 함
    const scenarioButtons = page.locator('button:has-text("공항에서"), button:has-text("카페에서"), button:has-text("호텔")');
    await expect(scenarioButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test("다른 주제 더보기 버튼이 작동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 다른 주제 더보기 버튼 클릭
    await page.getByRole("button", { name: "다른 주제 더보기" }).click();

    // 페이지가 여전히 로드된 상태여야 함
    await expect(page.getByText("이런 주제는 어때요?")).toBeVisible();
  });

  test("직접 말하기 버튼 클릭 시 직접 말하기 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 직접 말하기 버튼 클릭
    await page.getByRole("link", { name: "직접 말하기" }).click();

    // 직접 말하기 페이지로 이동 확인
    await expect(page).toHaveURL(/\/chat\/scenario-select\/direct-speech/);
  });

  test("시나리오 클릭 시 상세 팝업이 표시되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 첫 번째 시나리오 버튼 클릭
    const scenarioButton = page.locator('button:has-text("공항에서"), button:has-text("카페에서"), button:has-text("호텔")').first();
    await scenarioButton.click();

    // 상세 팝업 표시 확인
    await expect(page.getByText("장소:")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("상대:")).toBeVisible();
    await expect(page.getByText("목표:")).toBeVisible();

    // 대화 설정 섹션 확인
    await expect(page.getByText("대화 설정")).toBeVisible();
    await expect(page.getByText("자막 표시")).toBeVisible();
    await expect(page.getByText("목소리 톤")).toBeVisible();
  });

  test("시나리오 팝업에서 닫기 버튼이 작동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 시나리오 버튼 클릭
    const scenarioButton = page.locator('button:has-text("공항에서"), button:has-text("카페에서"), button:has-text("호텔")').first();
    await scenarioButton.click();

    // 팝업 닫기
    await page.getByRole("button", { name: "닫기" }).click();

    // 팝업이 닫혀야 함
    await expect(page.getByText("장소:")).not.toBeVisible();
  });

  test("시나리오 팝업에서 자막 토글이 작동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 시나리오 버튼 클릭
    const scenarioButton = page.locator('button:has-text("공항에서"), button:has-text("카페에서"), button:has-text("호텔")').first();
    await scenarioButton.click();

    // 자막 토글 확인
    const toggle = page.locator('button[role="switch"]');
    await expect(toggle).toBeVisible();

    // 토글 클릭
    await toggle.click();
  });

  test("시나리오 팝업에서 목소리 선택이 작동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/topic-suggestion");

    // 시나리오 버튼 클릭
    const scenarioButton = page.locator('button:has-text("공항에서"), button:has-text("카페에서"), button:has-text("호텔")').first();
    await scenarioButton.click();

    // 목소리 이름 확인
    await expect(page.getByText("Shimmer")).toBeVisible();

    // 다음 목소리 버튼 클릭
    const nextButton = page.locator('button:has([class*="ChevronRight"]), button:has-text("›")').last();
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  });

  test("시나리오 API 에러 시 에러 메시지가 표시되어야 함", async ({ page }) => {
    // 에러 응답 모킹
    await page.route("**/api/v1/scenarios*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    });

    await page.goto("/chat/scenario-select/topic-suggestion");

    // 에러 메시지 확인
    await expect(page.getByText("주제를 불러올 수 없어요")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("잠시 후 다시 시도해주세요")).toBeVisible();

    // 직접 말하기 버튼은 여전히 표시되어야 함
    await expect(page.getByRole("link", { name: "직접 말하기" })).toBeVisible();
  });

  test("로딩 중 상태가 표시되어야 함", async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route("**/api/v1/scenarios*", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SCENARIOS),
      });
    });

    await page.goto("/chat/scenario-select/topic-suggestion");

    // 로딩 메시지 확인
    await expect(page.getByText("주제를 불러오는 중...")).toBeVisible();
  });
});

test.describe("시나리오 선택 - 자막 설정 페이지", () => {
  test("자막 설정 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/subtitle-settings");

    // 페이지 제목 확인
    await expect(page.getByText("말랭이의 답변을 자막으로 볼까요?")).toBeVisible();
    await expect(page.getByText("내가 말한 내용은 자막으로 보이지 않아요.")).toBeVisible();

    // 버튼들 확인
    await expect(page.getByRole("button", { name: "자막 보기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "자막 없이 진행하기" })).toBeVisible();
  });

  test("자막 보기 선택 시 목소리 선택 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/subtitle-settings");

    await page.getByRole("button", { name: "자막 보기" }).click();

    // 목소리 선택 페이지로 이동 확인
    await expect(page).toHaveURL(/\/chat\/scenario-select\/voice-selection/);

    // localStorage 확인
    const subtitleEnabled = await page.evaluate(() => localStorage.getItem("subtitleEnabled"));
    expect(subtitleEnabled).toBe("true");
  });

  test("자막 없이 진행하기 선택 시 목소리 선택 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/subtitle-settings");

    await page.getByRole("button", { name: "자막 없이 진행하기" }).click();

    // 목소리 선택 페이지로 이동 확인
    await expect(page).toHaveURL(/\/chat\/scenario-select\/voice-selection/);

    // localStorage 확인
    const subtitleEnabled = await page.evaluate(() => localStorage.getItem("subtitleEnabled"));
    expect(subtitleEnabled).toBe("false");
  });
});

test.describe("시나리오 선택 - 목소리 선택 페이지", () => {
  test("목소리 선택 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/voice-selection");

    // 페이지 제목 확인
    await expect(page.getByText("말랭이 목소리 톤을 선택해 주세요.")).toBeVisible();

    // 기본 목소리 표시 확인
    await expect(page.getByText("Echo")).toBeVisible();

    // 대화 시작하기 버튼 확인
    await expect(page.getByRole("button", { name: "대화 시작하기" })).toBeVisible();
  });

  test("목소리 선택 화살표 버튼이 작동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/voice-selection");

    // 초기 목소리 확인
    await expect(page.getByRole("heading", { name: "Echo" })).toBeVisible();

    // 다음 버튼 클릭
    await page.getByLabel("다음 목소리").click();

    // 다른 목소리로 변경 확인
    await expect(page.getByRole("heading", { name: "Shimmer" })).toBeVisible();

    // 이전 버튼 클릭
    await page.getByLabel("이전 목소리").click();

    // 원래 목소리로 돌아옴
    await expect(page.getByRole("heading", { name: "Echo" })).toBeVisible();
  });

  test("미리듣기 버튼이 작동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/voice-selection");

    // 미리듣기 버튼 클릭
    const previewButton = page.getByRole("button", { name: /미리듣기/ });
    await expect(previewButton).toBeVisible();

    await previewButton.click();

    // 재생 중 상태로 변경 확인
    await expect(page.getByRole("button", { name: /재생 중/ })).toBeVisible({ timeout: 3000 });
  });

  test("대화 시작하기 버튼 클릭 시 대화 페이지로 이동해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/voice-selection");

    await page.getByRole("button", { name: "대화 시작하기" }).click();

    // 대화 페이지로 이동 확인
    await expect(page).toHaveURL(/\/chat\/conversation/);

    // localStorage에 목소리 설정 저장 확인
    const selectedVoice = await page.evaluate(() => localStorage.getItem("selectedVoice"));
    expect(selectedVoice).toBe("echo");
  });

  test("목소리 인디케이터가 현재 선택된 목소리를 표시해야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/voice-selection");

    // 인디케이터 도트 확인 (4개)
    const indicators = page.locator(".rounded-full.bg-brand, .rounded-full.bg-border");
    await expect(indicators).toHaveCount(4);
  });
});

test.describe("시나리오 선택 - 직접 말하기 페이지", () => {
  test.beforeEach(async ({ page, context }) => {
    // 마이크 권한 허용
    await context.grantPermissions(["microphone"]);
  });

  test("직접 말하기 페이지가 정상적으로 로드되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/direct-speech");

    // 캐릭터 표시 확인
    await expect(page.locator(".character-box")).toBeVisible();

    // 마이크 버튼 확인
    await expect(page.locator(".mic-container")).toBeVisible();
  });

  test("마이크 버튼이 표시되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/direct-speech");

    // 대화가 자동으로 시작되므로 마이크 버튼이 표시되어야 함
    await expect(page.locator(".mic-container")).toBeVisible({ timeout: 10000 });
  });

  test("캐릭터가 표시되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select/direct-speech");

    // 캐릭터가 표시되어야 함
    await expect(page.locator(".character-box")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("시나리오 선택 플로우 - 리다이렉트", () => {
  test("/chat/scenario-select 접속 시 topic-suggestion으로 리다이렉트되어야 함", async ({ page }) => {
    await page.goto("/chat/scenario-select");

    // topic-suggestion으로 리다이렉트 확인
    await expect(page).toHaveURL(/\/chat\/scenario-select\/topic-suggestion/, { timeout: 10000 });
  });
});

test.describe("시나리오 선택 - 반응형 디자인", () => {
  test.describe("모바일 뷰포트", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("모바일에서 주제 선택 페이지가 정상적으로 표시되어야 함", async ({ page }) => {
      await mockScenarioApi(page);
      await page.goto("/chat/scenario-select/topic-suggestion");

      await expect(page.getByText("이런 주제는 어때요?")).toBeVisible({ timeout: 10000 });
    });

    test("모바일에서 자막 설정 페이지가 정상적으로 표시되어야 함", async ({ page }) => {
      await page.goto("/chat/scenario-select/subtitle-settings");

      await expect(page.getByText("말랭이의 답변을 자막으로 볼까요?")).toBeVisible();
    });

    test("모바일에서 목소리 선택 페이지가 정상적으로 표시되어야 함", async ({ page }) => {
      await page.goto("/chat/scenario-select/voice-selection");

      await expect(page.getByText("말랭이 목소리 톤을 선택해 주세요.")).toBeVisible();
    });
  });

  test.describe("태블릿 뷰포트", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("태블릿에서 주제 선택 페이지가 정상적으로 표시되어야 함", async ({ page }) => {
      await mockScenarioApi(page);
      await page.goto("/chat/scenario-select/topic-suggestion");

      await expect(page.getByText("이런 주제는 어때요?")).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe("시나리오 선택 - 세션 생성 통합 테스트", () => {
  test("시나리오 선택 후 세션이 생성되고 대화 페이지로 이동해야 함", async ({ page }) => {
    await mockScenarioApi(page);
    await mockCreateSessionApi(page);

    await page.goto("/chat/scenario-select/topic-suggestion");

    // 시나리오 버튼 클릭
    const scenarioButton = page.locator('button:has-text("공항에서"), button:has-text("카페에서"), button:has-text("호텔")').first();
    await scenarioButton.click();

    // 이 주제로 시작하기 버튼 클릭
    await page.getByRole("button", { name: "이 주제로 시작하기" }).click();

    // 대화 페이지로 이동 확인
    await expect(page).toHaveURL(/\/chat\/conversation\?sessionId=/, { timeout: 10000 });
  });
});
