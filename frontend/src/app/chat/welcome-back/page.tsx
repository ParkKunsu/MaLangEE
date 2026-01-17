"use client";

// Welcome back page: Displays the last chat session and allows the user to continue or start a new one.

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Button, MalangEE } from "@/shared/ui";
import { useGetChatSessions, useGetChatSession } from "@/features/chat/api/use-chat-sessions";
import { AuthGuard } from "@/features/auth";

function WelcomeBackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const textOpacity = 1;

  // 1. 특정 세션 ID가 있을 경우 해당 세션 조회
  const { data: specificSession, isLoading: isSpecificLoading } = useGetChatSession(sessionId || "");

  // 2. 세션 ID가 없을 경우 최근 세션 조회
  const { data: sessions, isLoading: isSessionsLoading } = useGetChatSessions(0, 1);

  const isLoading = sessionId ? isSpecificLoading : isSessionsLoading;

  // 표시할 세션 결정
  const lastSession = useMemo(() => {
    if (sessionId) return specificSession || null;
    if (!sessions || !sessions.items || sessions.items.length === 0) return null;
    return sessions.items[0];
  }, [sessionId, specificSession, sessions]);

  // 대화 기록이 없으면 시나리오 선택 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !lastSession) {
      router.push("/demo");
    }
  }, [isLoading, lastSession, router]);

  const handleContinueChat = () => {
    // 텍스트 변경
    setIsConfirmed(true);

    // 1초 후 자막 설정 페이지로 이동 (sessionId 전달)
    setTimeout(() => {
      const targetSessionId = sessionId || lastSession?.session_id;
      if (targetSessionId) {
        router.push(`/chat/subtitle-settings?sessionId=${targetSessionId}`);
      } else {
        router.push("/chat/subtitle-settings");
      }
    }, 1000);
  };

  const handleNewTopic = () => {
    // 새로운 주제 선택 페이지로 이동
    router.push("/demo");
  };

  if (isLoading) {
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

  return (
    <>
      {/* Character */}
      <div className="character-box">
        <MalangEE size={150} />
      </div>

      {/* Text Group */}
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="welcome-back-title">
          {isConfirmed ? (
            <>
              {lastSession?.title}을
              <br />
              같이 재현해 볼까요?
            </>
          ) : (
            <>
              기다리고 있었어요!
              <br />
              지난번에 했던 {lastSession?.title},
              <br />이 주제로 다시 이야기해볼까요?
            </>
          )}
        </h1>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-4">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={handleContinueChat}
          disabled={isConfirmed}
          isLoading={isConfirmed}
        >
          {isConfirmed ? "시작 중..." : "대화 시작하기"}
        </Button>

        <Button
          variant="outline-purple"
          size="xl"
          fullWidth
          onClick={handleNewTopic}
          disabled={isConfirmed}
        >
          새로운 주제 고르기
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
