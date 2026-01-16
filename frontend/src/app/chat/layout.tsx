"use client";

import { ReactNode, useState } from "react";
import { AuthGuard } from "@/features/auth";
import { useAuth } from "@/features/auth/hook/use-auth";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button, MalangEE, PopupLayout } from "@/shared/ui";
import "@/shared/styles/scenario.css";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { logout } = useAuth();
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);

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

  return (
    <AuthGuard>
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
    </AuthGuard>
  );
}
