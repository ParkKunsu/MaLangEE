"use client";

import { FC, ReactNode, useState } from "react";
import { History, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hook/use-auth";
import { PopupLayout } from "../PopupLayout";
import { MalangEE } from "../MalangEE";
import { Button } from "../Button";
import Link from "next/link";

interface GlassCardProps {
  children: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  className?: string;
  showHeader?: boolean; // header 표시 여부 (기본값 true)
}

export const GlassCard: FC<GlassCardProps> = ({
  children,
  headerLeft,
  headerRight,
  footer,
  className = "",
  showHeader = false,
}) => {
  const { logout } = useAuth();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutPopup(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  const defaultHeaderLeft = (
    <div className="scenario-logo">
      <Link href={"/chat-history"} className="inline-block">
      <img src={"/images/logo.png"} alt="MalangEE Logo" width={100} height={"auto"} />
      </Link>
    </div>
  );

  const defaultHeaderRight = (
    <div className="flex items-center gap-4 hidden">
      <button
        className="text-[#6A667A] transition-colors hover:text-[#5F51D9]"
        onClick={() => (location.href = "/chat-history")}
        title="대화이력"
      >
        <History size={20} />
      </button>
      <button
        className="text-[#6A667A] transition-colors hover:text-[#5F51D9]"
        onClick={handleLogoutClick}
        title="로그아웃"
      >
        <LogOut size={20} />
      </button>
    </div>
  );

  return (
    <>
      <main className={`main-container glass-card w-full ${className}`}>
        {/* Header */}
        {showHeader && (
          <header className="glass-card-header">
            {headerLeft || defaultHeaderLeft}
            <div className="flex-1" />
            <div className="flex items-center gap-4">{headerRight || defaultHeaderRight}</div>
          </header>
        )}

        {/* Content */}
        <section className="glass-card-content">{children}</section>

        {/* Footer */}
        {footer && <footer className="glass-card-footer">{footer}</footer>}
      </main>

      {/* 로그아웃 확인 팝업 */}
      {showLogoutPopup && (
        <PopupLayout onClose={handleLogoutCancel} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">정말 로그아웃 하실건가요?</div>
            <div className="flex w-full gap-3">
              <Button
                variant="outline-purple"
                size="md"
                fullWidth
                onClick={handleLogoutCancel}
              >
                닫기
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleLogoutConfirm}
              >
                로그아웃
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
};
