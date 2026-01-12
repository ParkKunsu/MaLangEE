"use client";

import { FC, ReactNode } from "react";
import { History, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hook/use-auth";
import "./GlassCard.css";

interface GlassCardProps {
  children: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  withBackground?: boolean;
  className?: string;
  showHeader?: boolean; // header 표시 여부 (기본값 true)
}

export const GlassCard: FC<GlassCardProps> = ({
  children,
  headerLeft,
  headerRight,
  footer,
  withBackground = true,
  className = "",
  showHeader = true,
}) => {
  const { logout } = useAuth();

  const defaultHeaderLeft = (
    <div className="scenario-logo">
      <img src={"/images/logo.png"} alt="MalangEE Logo" width={100} height={"auto"} />
    </div>
  );

  const defaultHeaderRight = (
    <div className="flex items-center gap-4">
      <button
        className="text-[#6A667A] transition-colors hover:text-[#5F51D9]"
        onClick={() => (location.href = "/chat-history")}
        title="대화이력"
      >
        <History size={20} />
      </button>
      <button
        className="text-[#6A667A] transition-colors hover:text-[#5F51D9]"
        onClick={logout}
        title="대화종료"
      >
        <LogOut size={20} />
      </button>
    </div>
  );

  return (
    <div className="main-page glass-page">
      {/* Background Blobs */}
      {withBackground && (
        <>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </>
      )}

      {/* Main Card */}
      <main className={`main-container glass-card ${className}`}>
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
    </div>
  );
};
