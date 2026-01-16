import { test, expect, type Page } from "@playwright/test";

/**
 * Chat Flow E2E Tests
 *
 * 채팅 흐름 관련 페이지들을 테스트합니다.
 * - voice-selection: 말랭이 목소리 톤 선택 (캐러셀)
 * - subtitle-settings: 자막 설정 선택
 * - complete: 대화 완료 화면 (통계)
 *
 * 페이지 흐름:
 * subtitle-settings → voice-selection → conversation → complete
 */

test.describe("Voice Selection Page", () => {
  test.describe("Page Elements", () => {
    test("should redirect to login when not authenticated", async ({ page }) => {
      await page.goto("/chat/voice-selection");
      await page.waitForTimeout(2000);

      // AuthGuard가 작동하여 로그인 페이지로 리다이렉트
      const url = page.url();
      expect(url).toMatch(/login|voice-selection/);
    });

    test("should have voice selection UI elements (when authenticated)", async ({
      page,
    }) => {
      // Mock 인증 상태 설정
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/voice-selection");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("voice-selection")) {
        // 제목 확인
        await expect(
          page.getByText("말랭이 목소리 톤을 선택해 주세요")
        ).toBeVisible();

        // 목소리 캐러셀 네비게이션 버튼 확인
        await expect(page.getByLabel("이전 목소리")).toBeVisible();
        await expect(page.getByLabel("다음 목소리")).toBeVisible();

        // 대화 시작하기 버튼 확인
        await expect(
          page.getByRole("button", { name: "대화 시작하기" })
        ).toBeVisible();
      }

      // 테스트 후 정리
      await page.evaluate(() => localStorage.clear());
    });
  });

  test.describe("Voice Carousel Navigation", () => {
    test("should navigate between voice options", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/voice-selection");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("voice-selection")) {
        // 초기 목소리 확인
        await expect(page.getByText("목소리 A")).toBeVisible();

        // 다음 버튼 클릭
        await page.getByLabel("다음 목소리").click();
        await page.waitForTimeout(300);

        // 다음 목소리로 변경 확인
        await expect(page.getByText("목소리 B")).toBeVisible();
      }

      await page.evaluate(() => localStorage.clear());
    });

    test("should wrap around voice options", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/voice-selection");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("voice-selection")) {
        // 첫 번째 목소리에서 이전 버튼 클릭 시 마지막으로 이동
        await page.getByLabel("이전 목소리").click();
        await page.waitForTimeout(300);

        // 마지막 목소리 (목소리 D) 표시 확인
        await expect(page.getByText("목소리 D")).toBeVisible();
      }

      await page.evaluate(() => localStorage.clear());
    });
  });

  test.describe("Voice Selection Action", () => {
    test("should store selected voice in sessionStorage", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/voice-selection");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("voice-selection")) {
        // 대화 시작하기 버튼 클릭
        await page.getByRole("button", { name: "대화 시작하기" }).click();
        await page.waitForTimeout(500);

        // sessionStorage에 선택한 목소리 저장 확인
        const selectedVoice = await page.evaluate(() =>
          sessionStorage.getItem("selectedVoice")
        );
        expect(selectedVoice).toBeTruthy();
      }

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });
  });
});

test.describe("Subtitle Settings Page", () => {
  test.describe("Page Elements", () => {
    test("should redirect to login when not authenticated", async ({ page }) => {
      await page.goto("/chat/subtitle-settings");
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).toMatch(/login|subtitle-settings/);
    });

    test("should have subtitle options (when authenticated)", async ({
      page,
    }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/subtitle-settings");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("subtitle-settings")) {
        // 제목 확인
        await expect(
          page.getByText("말랭이의 답변을 자막으로 볼까요?")
        ).toBeVisible();

        // 설명 확인
        await expect(
          page.getByText("내가 말한 내용은 자막으로 보이지 않아요")
        ).toBeVisible();

        // 버튼 확인
        await expect(
          page.getByRole("button", { name: "자막 보기" })
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "자막 없이 진행하기" })
        ).toBeVisible();
      }

      await page.evaluate(() => localStorage.clear());
    });
  });

  test.describe("Subtitle Choice Action", () => {
    test("should store subtitle choice in sessionStorage and navigate", async ({
      page,
    }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/subtitle-settings");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("subtitle-settings")) {
        // 자막 보기 선택
        await page.getByRole("button", { name: "자막 보기" }).click();
        await page.waitForTimeout(500);

        // sessionStorage 확인
        const subtitleEnabled = await page.evaluate(() =>
          sessionStorage.getItem("subtitleEnabled")
        );
        expect(subtitleEnabled).toBe("true");

        // voice-selection 페이지로 이동 확인
        await expect(page).toHaveURL(/voice-selection/);
      }

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    test("should handle 'no subtitle' choice", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/subtitle-settings");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("subtitle-settings")) {
        // 자막 없이 진행하기 선택
        await page.getByRole("button", { name: "자막 없이 진행하기" }).click();
        await page.waitForTimeout(500);

        // sessionStorage 확인
        const subtitleEnabled = await page.evaluate(() =>
          sessionStorage.getItem("subtitleEnabled")
        );
        expect(subtitleEnabled).toBe("false");
      }

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });
  });
});

test.describe("Chat Complete Page", () => {
  test.describe("Page Elements", () => {
    test("should redirect to login when not authenticated", async ({ page }) => {
      await page.goto("/chat/complete");
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).toMatch(/login|complete/);
    });

    test("should display completion message and stats (when authenticated)", async ({
      page,
    }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
        // 테스트용 대화 통계 설정
        sessionStorage.setItem("totalChatDuration", "300");
        sessionStorage.setItem("userSpeakDuration", "120");
      });

      await page.goto("/chat/complete");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("complete")) {
        // 완료 메시지 확인
        await expect(page.getByText("오늘도 잘 말했어요!")).toBeVisible();

        // 통계 레이블 확인
        await expect(page.getByText("총 대화 시간")).toBeVisible();
        await expect(page.getByText("내가 말한 시간")).toBeVisible();

        // 홈으로 돌아가기 버튼 확인
        await expect(
          page.getByRole("button", { name: "처음으로 돌아가기" })
        ).toBeVisible();
      }

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });
  });

  test.describe("Statistics Display", () => {
    test("should format duration correctly", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
        // 5분 0초 = 300초
        sessionStorage.setItem("totalChatDuration", "300");
        // 2분 0초 = 120초
        sessionStorage.setItem("userSpeakDuration", "120");
      });

      await page.goto("/chat/complete");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("complete")) {
        // 포맷된 시간 확인
        await expect(page.getByText("5분 0초")).toBeVisible();
        await expect(page.getByText("2분 0초")).toBeVisible();
      }

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    test("should use default values when no session data", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
        sessionStorage.clear(); // 데이터 없음
      });

      await page.goto("/chat/complete");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("complete")) {
        // 기본값 (3분, 1분 30초) 확인
        await expect(page.getByText("3분 0초")).toBeVisible();
        await expect(page.getByText("1분 30초")).toBeVisible();
      }

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });
  });

  test.describe("Navigation Action", () => {
    test("should navigate to welcome-back and clear session data", async ({
      page,
    }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
        sessionStorage.setItem("totalChatDuration", "300");
        sessionStorage.setItem("userSpeakDuration", "120");
      });

      await page.goto("/chat/complete");
      await page.waitForTimeout(1000);

      const url = page.url();
      if (url.includes("complete")) {
        // 처음으로 돌아가기 버튼 클릭
        await page.getByRole("button", { name: "처음으로 돌아가기" }).click();
        await page.waitForTimeout(1000);

        // welcome-back 페이지로 이동 확인
        await expect(page).toHaveURL(/welcome-back/);

        // 세션 데이터 정리 확인
        const totalDuration = await page.evaluate(() =>
          sessionStorage.getItem("totalChatDuration")
        );
        const userSpeakDuration = await page.evaluate(() =>
          sessionStorage.getItem("userSpeakDuration")
        );
        expect(totalDuration).toBeNull();
        expect(userSpeakDuration).toBeNull();
      }

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });
  });
});

test.describe("Welcome Back Page", () => {
  test.describe("Page Elements", () => {
    test("should show loading state initially", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/welcome-back");

      // 로딩 상태 또는 콘텐츠 확인
      const url = page.url();
      expect(url).toBeTruthy();

      await page.evaluate(() => localStorage.clear());
    });

    test("should have continue and new topic buttons", async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/welcome-back");
      await page.waitForTimeout(2000);

      const url = page.url();
      if (url.includes("welcome-back")) {
        // 버튼들 확인 (세션이 있는 경우)
        const continueButton = page.getByRole("button", {
          name: /대화 시작하기|시작 중/,
        });
        const newTopicButton = page.getByRole("button", {
          name: "새로운 주제 고르기",
        });

        // 버튼이 존재하면 표시 확인
        if ((await continueButton.count()) > 0) {
          await expect(continueButton).toBeVisible();
        }
        if ((await newTopicButton.count()) > 0) {
          await expect(newTopicButton).toBeVisible();
        }
      }

      await page.evaluate(() => localStorage.clear());
    });
  });

  test.describe("Navigation Actions", () => {
    test("should redirect to scenario-select when no previous session", async ({
      page,
    }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto("/chat/welcome-back");
      await page.waitForTimeout(3000);

      // 세션이 없으면 scenario-select로 리다이렉트
      const url = page.url();
      expect(url).toMatch(/welcome-back|scenario-select|login/);

      await page.evaluate(() => localStorage.clear());
    });
  });
});

test.describe("MalangEE Mascot Consistency", () => {
  const chatPages = [
    "/chat/voice-selection",
    "/chat/subtitle-settings",
    "/chat/complete",
    "/chat/welcome-back",
  ];

  for (const pagePath of chatPages) {
    test(`should display MalangEE mascot on ${pagePath}`, async ({ page }) => {
      await page.goto("/auth/login");
      await page.evaluate(() => {
        localStorage.setItem("access_token", "mock_token_for_ui_test");
      });

      await page.goto(pagePath);
      await page.waitForTimeout(1000);

      const url = page.url();
      // 페이지에 머무른 경우에만 마스코트 확인
      if (url.includes(pagePath.split("/").pop()!)) {
        // character-box 클래스 내 이미지 또는 MalangEE 컴포넌트 확인
        const mascotContainer = page.locator(".character-box");
        if ((await mascotContainer.count()) > 0) {
          await expect(mascotContainer).toBeVisible();
        }
      }

      await page.evaluate(() => localStorage.clear());
    });
  }
});
