"use client";

// Welcome back page: Displays the last chat session and allows the user to continue or start a new one.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button, MalangEE } from "@/shared/ui";
import { useGetChatSession } from "@/features/chat/api/use-chat-sessions";
import { AuthGuard, useCurrentUser } from "@/features/auth";

function WelcomeBackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  let sessionId = searchParams.get("sessionId");
  const textOpacity = 1;

  // 현재 사용자 정보 조회
  const { data: currentUser } = useCurrentUser();

  // 로컬 스토리지에서 sessionId 가져오기 및 entryType 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      // entryType 설정
      if (currentUser) {
        localStorage.setItem("entryType", "member");
        if (currentUser.login_id) {
          localStorage.setItem("loginId", currentUser.login_id);
        }
      } else {
        localStorage.setItem("entryType", "guest");
      }
    }
  }, [currentUser]);

  if (sessionId == null) {
    sessionId = localStorage.getItem("chatSessionId");
  } else {
    localStorage.setItem("chatSessionId", sessionId);
  }

  // 1. 특정 세션 ID가 있을 경우 해당 세션 조회
  const { data: sessionDetail, isLoading } = useGetChatSession(sessionId);

  // 세션 정보 로컬 스토리지 저장 (voice, subtitleEnabled, scenario info)
  useEffect(() => {
    if (sessionDetail) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = sessionDetail as unknown as Record<string, unknown>;

      // voice 설정 (없으면 기본값 'nova')
      if (detail.voice) {
        localStorage.setItem("selectedVoice", String(detail.voice));
      } else {
        localStorage.setItem("selectedVoice", "nova");
      }

      // subtitleEnabled 설정 (boolean -> string)
      if (detail.show_text) {
        localStorage.setItem("subtitleEnabled", String(detail.show_text));
      } else {
        localStorage.setItem("subtitleEnabled", "true");
      }

      // 시나리오 정보 저장 (conversationGoal, conversationPartner, place)
      if (detail.scenario_goal) {
        localStorage.setItem("conversationGoal", String(detail.scenario_goal));
      }
      if (detail.scenario_partner) {
        localStorage.setItem("conversationPartner", String(detail.scenario_partner));
      }
      if (detail.scenario_place) {
        localStorage.setItem("place", String(detail.scenario_place));
      }
    }
  }, [sessionDetail]);

  // 대화 기록이 없으면 시나리오 선택 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && sessionId && !sessionDetail) {
      // 세션 ID는 있는데 조회가 안되는 경우 (삭제됨 등)
      router.push("/chat/scenario-select");
    } else if (isLoading && !sessionId) {
      // 세션 ID가 없는 경우
      router.push("/chat/scenario-select");
    }
  }, [isLoading, sessionId, sessionDetail, router]);

  if (isLoading || !sessionDetail) {
    return (
      <>
        <div className="character-box">
          <MalangEE size={150} />
        </div>
        <div className="text-group">
          <h1 className="scenario-title">잠시만 기다려주세요...</h1>
        </div>
      </>
    );
  }

  // sessionDetail 구조에 따라 title 접근 (API 응답 구조 확인 필요)
  // 현재 useGetChatSession은 ChatSessionDetail을 반환하며, 이는 { session: ChatSession, messages: ChatMessage[] } 구조임
  // 하지만 API 응답 예시에 따르면 최상위에 title이 있을 수도 있음. 안전하게 접근.
  const title =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sessionDetail as unknown as Record<string, unknown>).title as string || ((sessionDetail as unknown as Record<string, { title?: string }>).session?.title) || "이전 대화";

  return (
    <>
      {/* Character */}
      <div className="character-box">
        <MalangEE size={150} />
      </div>

      {/* Text Group */}
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="welcome-back-title">
          기다리고 있었어요!
          <br />
          지난번에 했던 {title},
          <br />이 주제로 다시 이야기해볼까요?
        </h1>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-4">
        <Button asChild variant="primary" size="xl" fullWidth>
          <Link href="/chat/conversation">대화 시작하기</Link>
        </Button>

        <Button asChild variant="outline-purple" size="xl" fullWidth>
          <Link href="/chat/scenario-select">새로운 주제 고르기</Link>
        </Button>
      </div>
    </>
  );
}

export default function WelcomeBackPageWithGuard() {
  return (
    <AuthGuard>
      <WelcomeBackPage />
    </AuthGuard>
  );
}
