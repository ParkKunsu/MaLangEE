import React, { useEffect } from "react";
import Image from "next/image";
import { GlassCard } from "./GlassCard";
import { MalangEE } from "./MalangEE";
import Link from "next/link";

interface SplitViewLayoutProps {
  leftChildren?: React.ReactNode;
  rightChildren: React.ReactNode;
  maxWidth?: string; // 최대 너비 클래스 (예: "md:max-w-[350px]")
  bgClass?: string; // body 배경 클래스 (예: "bg-login-01")
  leftColSpan?: number; // 왼쪽 영역 너비 비율 (1-11, 기본값 4)
  rightColSpan?: number; // 오른쪽 영역 너비 비율 (1-11, 기본값 8)
  showHeader?: boolean; // GlassCard 헤더 표시 여부 (기본값 true)
  leftClassName?: string;
  rightClassName?: string;
  glassClassName?: string;
  glassMaxWidth?: string; // GlassCard의 최대 너비 (기본값: max-w-[550px])
  gap?: string; // 그리드 간격 클래스 (기본값: gap-8)
}

export const SplitViewLayout = ({
  leftChildren,
  rightChildren,
  maxWidth = "md:max-w-6xl", // 기본값
  bgClass = "bg-login-01", // 기본값
  leftColSpan = 5,
  rightColSpan = 7,
  showHeader = true, // 기본값 true
  leftClassName = "w-full px-4 py-8 md:p-10",
  rightClassName = "",
  glassClassName = "p-6 md:p-10",
  glassMaxWidth = "max-w-full md:max-w-2xl lg:max-w-4xl", // 기본값
  gap = "gap-0 md:gap-8", // 기본값 (모바일 0, 데스크탑 8)
}: SplitViewLayoutProps) => {
  const colSpans: Record<number, string> = {
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    7: "md:col-span-7",
    8: "md:col-span-8",
  };

  useEffect(() => {
    // body 배경 클래스 적용
    document.body.classList.add(bgClass);

    // cleanup: 배경 클래스 제거
    return () => {
      document.body.classList.remove(bgClass);
    };
  }, [bgClass]);

  return (
    <div className={`main-page glass-page relative min-h-screen w-full overflow-hidden ${bgClass}`}>
      <div className={`relative z-10 mx-auto w-full px-0 md:px-10 ${maxWidth || "md:max-w-5xl"}`}>
        <div className={`mx-auto grid w-full grid-cols-1 ${gap} md:grid-cols-12`}>
          {/* Left Content Section */}
          <div
            className={`flex flex-col items-center justify-center gap-6 text-center md:items-start md:text-left ${colSpans[leftColSpan] || "md:col-span-6"} ${leftClassName}`}
          >
            <>
              <div className="text-lg font-semibold text-[#5F51D9] mb-4">
                <Link href={"/chat-history"} className="inline-block">
                  <Image src="/images/logo.png" alt="MalangEE Logo" width={100} height={50} />
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <MalangEE size={120} />
              </div>
            </>
            {leftChildren && <div className="space-y-2">{leftChildren}</div>}
          </div>

          {/* Right Content Section */}
          <div
            className={`flex items-center justify-center gap-6 ${colSpans[rightColSpan] || "md:col-span-6"} ${rightClassName}`}
          >
            <GlassCard
              showHeader={showHeader}
              className={`w-full ${glassMaxWidth} mx-auto ${glassClassName}`}
            >
              {rightChildren}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};
