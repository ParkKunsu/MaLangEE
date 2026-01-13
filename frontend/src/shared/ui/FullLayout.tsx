import React, { useEffect } from "react";
import { GlassCard } from "./GlassCard";

interface FullLayoutProps {
  children: React.ReactNode;
  bgClass?: string; // body에 적용할 배경 클래스 (예: 'bg-login-01')
  showHeader?: boolean; // GlassCard의 header 표시 여부 (기본값 true)
  maxWidth?: string; // 최대 넓이 (예: 'max-w-[350px]', 'max-w-md')
  withBackground?: boolean;
}

export const FullLayout = ({
  children,
  bgClass = "bg-login-02", // 기본값
  showHeader = false, // 기본값 true
  maxWidth, // 기본값 없음 (제한 없음)
  withBackground = true,
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
    <div className="main-page glass-page">
      {/* Background Blobs */}
      {withBackground && (
        <>
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </>
      )}

      <div
        className={
          maxWidth
            ? `w-full sm:w-[90vw] ${maxWidth}`
            : `w-full sm:w-[90vw] md:min-w-[960px] md:max-w-[80vw]`
        }
      >
        <GlassCard showHeader={showHeader}>
          {children}
        </GlassCard>
      </div>
    </div>
  );
};
