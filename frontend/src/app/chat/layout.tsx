"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { tokenStorage } from "@/features/auth/model";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button, MalangEE, PopupLayout } from "@/shared/ui";
import { Square, Volume2, VolumeX, Pause } from "lucide-react";
import "@/shared/styles/scenario.css";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false); // 소켓 연결 상태

  // 클라이언트에서만 토큰 확인 (hydration 에러 방지)
  useEffect(() => {
    setHasToken(tokenStorage.exists());
  }, []);

  // 소켓 연결 상태 리스닝
  useEffect(() => {
    const handleSocketStatus = (event: CustomEvent<{ isConnected: boolean }>) => {
      setIsSocketConnected(event.detail.isConnected);
    };

    window.addEventListener("socket-status", handleSocketStatus as EventListener);
    return () => {
      window.removeEventListener("socket-status", handleSocketStatus as EventListener);
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

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    // TODO: 실제 일시정지 로직 연동 (Custom Event 등 활용)
    window.dispatchEvent(new CustomEvent("toggle-pause", { detail: { isPaused: !isPaused } }));
  };

  const handleEndChatConfirm = () => {
    setShowEndChatPopup(false);
    // 대시보드로 이동
    router.push("/dashboard");
  };

  const handleEndChatCancel = () => {
    setShowEndChatPopup(false);
  };

  // 헤더 우측 버튼 그룹 (로그인한 사용자만 표시)
  const headerRightContent = hasToken ? (
    <div className="flex items-center gap-2">
      {/* 음소거 버튼 */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full text-[#6A667A] transition-colors hover:bg-gray-100 hover:text-[#5F51D9]"
        onClick={handleMuteToggle}
        aria-label={isMuted ? "음소거 해제" : "음소거"}
      >
        {isMuted ? <VolumeX size={24} strokeWidth={2.5} /> : <Volume2 size={24} strokeWidth={2.5} />}
      </button>

      {/* 일시정지 버튼 (소켓 연결 상태일 때만 표시) */}
      {isSocketConnected && (
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#6A667A] transition-colors hover:bg-gray-100 hover:text-[#5F51D9]"
          onClick={handlePauseToggle}
          aria-label={isPaused ? "재개" : "일시정지"}
        >
          <Pause size={24} strokeWidth={2.5} fill={isPaused ? "currentColor" : "none"} />
        </button>
      )}

      {/* 대화 종료 버튼 */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full text-[#6A667A] transition-colors hover:bg-gray-100 hover:text-[#5F51D9]"
        onClick={handleEndChat}
        aria-label="대화 종료하기"
      >
        <Square size={24} strokeWidth={2.5} fill="currentColor" />
      </button>
    </div>
  ) : null;

  return (
    <>
      <FullLayout showHeader={true} headerRight={headerRightContent}>
        {children}
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
