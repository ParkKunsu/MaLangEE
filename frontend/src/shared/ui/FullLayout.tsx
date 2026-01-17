import React, { useEffect, ReactNode } from "react";
import { GlassCard } from "./GlassCard";

interface FullLayoutProps {
  children: React.ReactNode;
  bgClass?: string; // body에 적용할 배경 클래스 (예: 'bg-login-01')
  showHeader?: boolean; // GlassCard의 header 표시 여부 (기본값 true)
  maxWidth?: string; // 최대 넓이 (예: 'max-w-[350px]', 'max-w-md')
  withBackground?: boolean;
  headerRight?: ReactNode; // 헤더 우측 커스텀 콘텐츠
}

export const FullLayout = ({
  children,
  bgClass = "bg-login-02", // 기본값
  showHeader = false, // 기본값 true
  withBackground = true,
  headerRight,
  maxWidth = "max-w-full md:max-w-3xl lg:max-w-5xl",
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

      <div
        className={
          typeof maxWidth === "string" && maxWidth.trim().length > 0
            ? `w-full sm:w-[90vw] ${maxWidth}`
            : `w-full sm:w-[90vw] md:min-w-[960px] md:max-w-[80vw]`
        }
      >
        <GlassCard showHeader={showHeader} headerRight={headerRight}>
          {children}
        </GlassCard>
      </div>
    </div>
  );
};
