"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button, DebugStatus, MalangEE, PopupLayout } from "@/shared/ui";
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
    lastEvent: string | null;
    isAiSpeaking: boolean;
    isUserSpeaking?: boolean;
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
    // conversation 페이지에서는 custom event 발생 (대화 종료)
    if (pathname === "/chat/conversation") {
      window.dispatchEvent(new CustomEvent("end-conversation"));
    } else {
      // 다른 페이지에서는 기존 로그아웃 팝업 표시
      setShowEndChatPopup(true);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // TODO: 실제 음소거 로직 연동 (Custom Event 등 활용)
    window.dispatchEvent(new CustomEvent("toggle-mute", { detail: { isMuted: !isMuted } }));
  };

  const handleEndChatConfirm = () => {
    setShowEndChatPopup(false);
    // 완료 페이지로 이동
    router.push("/chat/complete");
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
        lastEvent={debugInfo.lastEvent}
        isAiSpeaking={debugInfo.isAiSpeaking}
        isUserSpeaking={debugInfo.isUserSpeaking}
      />

      <FullLayout showHeader={true} headerRight={headerRightContent}>
        {children}
      </FullLayout>

      {/* 대화 종료 확인 팝업 */}
      {showEndChatPopup && (
        <PopupLayout onClose={handleEndChatCancel} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">
              지금은 여기까지만 할까요?<br/>
              나중에 같은 주제로 다시 대화할 수 있어요.</div>
            <div className="flex w-full gap-3">
              <Button variant="outline-purple" size="md" fullWidth onClick={handleEndChatCancel}>
                이어 말하기
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleEndChatConfirm}>
                대화 그만하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}

      {/* 로그아웃 확인 팝업 */}
      {showLogoutPopup && (
        <PopupLayout onClose={handleLogoutCancel} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">정말 로그아웃 하실건가요?</div>
            <div className="flex w-full gap-3">
              <Button variant="outline-purple" size="md" fullWidth onClick={handleLogoutCancel}>
                닫기
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleLogoutConfirm}>
                로그아웃
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
