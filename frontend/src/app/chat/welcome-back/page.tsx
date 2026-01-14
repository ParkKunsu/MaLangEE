"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button, MalangEE } from "@/shared/ui";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useGetChatSessions } from "@/features/chat/api/use-chat-sessions";
import "@/shared/styles/scenario.css";

export default function WelcomeBackPage() {
  const router = useRouter();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const textOpacity = 1;

  // 실제 API에서 사용자 정보와 최근 세션 가져오기
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const { data: sessions, isLoading: isSessionsLoading } = useGetChatSessions(0, 1);

  const isLoading = isUserLoading || isSessionsLoading;

  // 가장 최근 세션
  const lastSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return sessions[0];
  }, [sessions]);

  // 사용자 닉네임
  const userNickname = useMemo(() => {
    if (!currentUser) return "사용자";
    return currentUser.nickname || currentUser.login_id || "사용자";
  }, [currentUser]);

  // 대화 기록이 없으면 시나리오 선택 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !lastSession) {
      router.push("/auth/scenario-select");
    }
  }, [isLoading, lastSession, router]);

  const handleContinueChat = () => {
    // 텍스트 변경
    setIsConfirmed(true);

    // 1초 후 자막 설정 페이지로 이동
    setTimeout(() => {
      router.push("/chat/subtitle-settings");
    }, 1000);
  };

  const handleNewTopic = () => {
    // 새로운 주제 선택 페이지로 이동
    router.push("/auth/scenario-select");
  };

  if (isLoading) {
    return (
      <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
        <div className="character-box">
          <MalangEE size={150} />
        </div>
        <div className="text-group">
          <h1 className="scenario-title">잠시만 기다려주세요...</h1>
        </div>
      </FullLayout>
    );
  }

  return (
    <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
      {/* Character */}
      <div className="character-box">
        <MalangEE size={150} />
      </div>

      {/* Text Group */}
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <p className="scenario-desc">{userNickname}님, 기다리고 있었어요!</p>
        <h1 className="scenario-title">
          {isConfirmed ? (
            <>
              {lastSession?.title}을
              <br />
              같이 재현해 볼까요?
            </>
          ) : (
            <> 지난번에 했던
              {lastSession?.title},
              <br/>이 주제로 다시 이야기해볼까요?</>
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
    </FullLayout>
  );
}
