"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button, MalangEE, PopupLayout } from "@/shared/ui";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useGetChatSessions } from "@/features/chat/api/use-chat-sessions";
import { useAuth } from "@/features/auth/hook/use-auth";
import "@/shared/styles/scenario.css";
import { AuthGuard } from "@/features/auth";

export default function WelcomeBackPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);
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

  const handleEndChat = () => {
    setShowEndChatPopup(true);
  };

  const handleEndChatConfirm = () => {
    setShowEndChatPopup(false);
    logout();
  };

  const handleEndChatCancel = () => {
    setShowEndChatPopup(false);
  };

  // 헤더 우측 "대화 종료하기" 버튼
  const headerRightContent = (
    <button
      className="text-sm text-[#6A667A] transition-colors hover:text-[#5F51D9]"
      onClick={handleEndChat}
      style={{ letterSpacing: "-0.2px" }}
    >
      대화 종료하기
    </button>
  );

  if (isLoading) {
    return (
      <FullLayout showHeader={true} >
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
    <>
      <FullLayout showHeader={true} headerRight={headerRightContent}>
        {/* Character */}
        <div className="character-box">
          <MalangEE size={150} />
        </div>

        {/* Text Group */}
        <div className="text-group text-center" style={{ opacity: textOpacity }}>
          <h1 className="welcome-back-title">
            {isConfirmed ? (
              <>
                {userNickname}님,
                <br />
                {lastSession?.title}을
                <br />
                같이 재현해 볼까요?
              </>
            ) : (
              <>
                {userNickname}님, 기다리고 있었어요!
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
      </FullLayout>

      {/* 대화 종료 확인 팝업 */}
      {showEndChatPopup && (
        <PopupLayout onClose={handleEndChatCancel} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">대화를 종료하시겠어요?</div>
            <div className="flex w-full gap-3">
              <Button variant="outline-purple" size="md" fullWidth onClick={handleEndChatCancel}>
                취소
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleEndChatConfirm}>
                종료하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
