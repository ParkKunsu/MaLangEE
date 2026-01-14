import React, { useEffect } from "react";
import { GlassCard } from "./GlassCard";

interface FullLayoutProps {
  children: React.ReactNode;
  bgClass?: string; // body에 적용할 배경 클래스 (예: 'bg-login-01')
  showHeader?: boolean; // GlassCard의 header 표시 여부 (기본값 true)
  maxWidth?: string; // 최대 넓이 (예: 'max-w-[350px]', 'max-w-md')
  withBackground?: boolean;
  glassClassName?: string;
  glassMaxWidth?: string; // GlassCard의 최대 너비 (기본값: max-w-[550px])
}

export const FullLayout = ({
  children,
  bgClass = "bg-login-02", // 기본값
  showHeader = false, // 기본값 true
  withBackground = true,
  maxWidth="md:max-w-6xl",
  glassClassName = "p-6 md:p-10",
  glassMaxWidth = "max-w-full md:max-w-2xl lg:max-w-4xl", // 기본값
}: FullLayoutProps) => {
  useEffect(() => {
    // body에 배경 클래스 적용
    document.body.classList.add(bgClass);

    // cleanup: 컴포넌트 언마운트 시 클래스 제거
    return () => {
      document.body.classList.remove(bgClass);
    };
  }, [bgClass]);

  return (
    <div className={`main-page glass-page relative min-h-screen w-full overflow-hidden ${bgClass}`}>
      {/* Background Blobs */}
      {withBackground && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
      )}

      <div className={`relative z-10 w-full ${maxWidth || "md:max-w-5xl"}`}>
        <GlassCard
          showHeader={showHeader}
          className={`w-full ${glassMaxWidth} mx-auto ${glassClassName}`}
        >
          {children}
        </GlassCard>
      </div>
    </div>
  );
};
