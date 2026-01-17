"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { tokenStorage } from "@/features/auth/model";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button, MalangEE, PopupLayout } from "@/shared/ui";
import "@/shared/styles/scenario.css";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // 클라이언트에서만 토큰 확인 (hydration 에러 방지)
  useEffect(() => {
    setHasToken(tokenStorage.exists());
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

  const handleEndChatConfirm = () => {
    setShowEndChatPopup(false);
    // 토큰 제거 및 로그인 페이지로 이동
    tokenStorage.remove();
    router.push("/auth/login");
  };

  const handleEndChatCancel = () => {
    setShowEndChatPopup(false);
  };

  // 헤더 우측 "대화 종료하기" 버튼 (로그인한 사용자만 표시)
  const headerRightContent = hasToken ? (
    <button
      className="text-sm text-[#6A667A] transition-colors hover:text-[#5F51D9]"
      onClick={handleEndChat}
      style={{ letterSpacing: "-0.2px" }}
    >
      대화 종료하기
    </button>
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
