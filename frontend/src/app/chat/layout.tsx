"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button, DebugStatus, MalangEE, ConfirmPopup } from "@/shared/ui";
import { History, LogOut, Volume2, VolumeX } from "lucide-react";
import "@/shared/styles/scenario.css";
import { useAuth } from "@/features/auth";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false); // 소켓 연결 상태
  const { logout, isAuthenticated } = useAuth();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleLogoutConfirm = () => {
    setShowLogoutPopup(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  // 디버그 상태 관리
  const [debugInfo, setDebugInfo] = useState<{
    isConnected: boolean;
    isReady?: boolean;
    lastEvent: string | null;
    isAiSpeaking: boolean;
    isUserSpeaking?: boolean;
    isMuted?: boolean;
    isRecording?: boolean;
    userTranscript?: string;
  }>({
    isConnected: false,
    lastEvent: null,
    isAiSpeaking: false,
  });

  // 소켓 및 디버그 상태 리스닝
  useEffect(() => {
    const handleSocketStatus = (event: CustomEvent<{ isConnected: boolean }>) => {
      setIsSocketConnected(event.detail.isConnected);
    };

    const handleDebugStatus = (event: CustomEvent) => {
      setDebugInfo(event.detail);
    };

    window.addEventListener("socket-status", handleSocketStatus as EventListener);
    window.addEventListener("chat-debug-status", handleDebugStatus as EventListener);

    return () => {
      window.removeEventListener("socket-status", handleSocketStatus as EventListener);
      window.removeEventListener("chat-debug-status", handleDebugStatus as EventListener);
    };
  }, []);

  const handleEndChat = () => {
    setShowEndChatPopup(true);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // TODO: 실제 음소거 로직 연동 (Custom Event 등 활용)
    window.dispatchEvent(new CustomEvent("toggle-mute", { detail: { isMuted: !isMuted } }));
  };

  const handleEndChatConfirm = () => {
    setShowEndChatPopup(false);
    // conversation 페이지에서는 이벤트 발생 (page에서 disconnect 후 라우팅)
    if (pathname === "/chat/conversation") {
      window.dispatchEvent(new CustomEvent("confirm-end-conversation"));
    } else {
      // 다른 페이지에서는 바로 대시보드로 이동
      router.push("/dashboard");
    }
  };

  const handleEndChatCancel = () => {
    setShowEndChatPopup(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  // 헤더 우측 버튼 그룹 (로그인한 사용자만 표시)
  // /chat/complete 페이지에서는 버튼 숨김
  const headerRightContent =
    isAuthenticated && pathname !== "/chat/complete" ? (
      <div className="flex items-center gap-2 ">
        <button
          className="hidden transition-colors hover:text-[#5F51D9]"
          onClick={() => (location.href = "/dashboard")}
          title="마이페이지"
        >
          <History size={20} />
        </button>
        <button
          className="hidden text-[#6A667A] transition-colors"
          onClick={handleLogoutClick}
          title="로그아웃"
        >
          <LogOut size={20} />
        </button>

        {/* 음소거 버튼 */}
        <button
          className="hidden text-[#6A667A] transition-colors"
          onClick={handleMuteToggle}
          title={isMuted ? "음소거 해제" : "음소거"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* 대화 종료 버튼 */}
        <button
          className="text-[#6A667A] transition-colors"
          onClick={handleEndChat}
          title="대화 종료하기"
        >
          대화종료하기
        </button>
      </div>
    ) : null;

  return (
    <>
      <DebugStatus
        isConnected={debugInfo.isConnected}
        isReady={debugInfo.isReady}
        lastEvent={debugInfo.lastEvent}
        isAiSpeaking={debugInfo.isAiSpeaking}
        isUserSpeaking={debugInfo.isUserSpeaking}
        isMuted={debugInfo.isMuted}
        isRecording={debugInfo.isRecording}
        userTranscript={debugInfo.userTranscript}
      />

      <FullLayout showHeader={true} headerRight={headerRightContent}>
        {children}
      </FullLayout>

      {/* 대화 종료 확인 팝업 */}
      {showEndChatPopup && (
        <ConfirmPopup
          message={
            <div className="text-xl font-bold text-[#1F1C2B]">
              지금은 여기까지만 할까요?<br />
              나중에 같은 주제로 다시 대화할 수 있어요.
            </div>
          }
          confirmText="대화 그만하기"
          cancelText="이어 말하기"
          onConfirm={handleEndChatConfirm}
          onCancel={handleEndChatCancel}
          showMalangEE
          malangEEStatus="humm"
          maxWidth="sm"
        />
      )}

      {/* 로그아웃 확인 팝업 */}
      {showLogoutPopup && (
        <ConfirmPopup
          message={
            <div className="text-xl font-bold text-[#1F1C2B]">정말 로그아웃 하실건가요?</div>
          }
          confirmText="로그아웃"
          cancelText="닫기"
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
          showMalangEE
          malangEEStatus="humm"
          maxWidth="sm"
        />
      )}
    </>
  );
}
