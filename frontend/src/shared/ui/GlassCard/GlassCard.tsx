"use client";

import { FC, ReactNode } from "react";
import { useAuth } from "@/features/auth/hook/use-auth";
import "./GlassCard.css";

interface GlassCardProps {
  children: ReactNode;
  header?: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  withBackground?: boolean;
  className?: string;
}

export const GlassCard: FC<GlassCardProps> = ({
  children,
  header,
  headerLeft,
  headerRight,
  footer,
  withBackground = true,
  className = "",
}) => {
  const { logout } = useAuth();

  const defaultHeaderLeft = <div className="scenario-logo">MalangEE</div>;

  const defaultHeaderRight = (
    <div className="flex items-center gap-4">
      <button
        className="btn-exit"
        onClick={() => (location.href = "/chat-history")}
      >
        대화이력
      </button>
      <button className="btn-exit" onClick={logout}>
        대화종료
      </button>
    </div>
  );

  return (
    <div className={`glass-page ${className}`}>
      {/* Background Blobs */}
      {withBackground && (
        <>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </>
      )}

      {/* Main Card */}
      <main className="glass-card">
        {/* Header */}
        <header className="glass-card-header">
          {header ? (
            header
          ) : (
            <>
              {headerLeft || defaultHeaderLeft}
              {headerRight || defaultHeaderRight}
            </>
          )}
        </header>

        {/* Content */}
        <section className="glass-card-content">{children}</section>

        {/* Footer */}
        {footer && <footer className="glass-card-footer">{footer}</footer>}
      </main>
    </div>
  );
};
