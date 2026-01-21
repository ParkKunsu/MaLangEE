"use client";

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
  leftClassName = "px-0 md:p-10 md:pr-15", // PC 오른쪽 여백을 15로 조정
  rightClassName = "",
  glassClassName = "p-6 md:p-10",
  glassMaxWidth = "max-w-full md:max-w-2xl lg:max-w-4xl", // 기본값
  gap = "gap-0 md:gap-6", // 기본값 (모바일 0, 데스크탑 8)
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
    <div
      className={`main-page glass-page relative min-h-screen w-full overflow-x-hidden ${bgClass}`}
    >
      <div className={`relative z-10 mx-auto w-full px-0 md:px-10 ${maxWidth || "md:max-w-5xl"}`}>
        <div className={`mx-auto grid w-full grid-cols-1 ${gap} md:grid-cols-12`}>
          {/* Left Content Section */}
          <div
            id="sv-left-content"
            className={`flex w-full max-w-[80%] mx-auto flex-col items-center justify-center gap-6 pb-10 pt-20 text-center md:max-w-none md:mx-0 md:items-start md:pt-0 md:text-left ${colSpans[leftColSpan] || "md:col-span-6"} ${leftClassName}`}
          >
            <>
              <div
                id="sv-logo"
                className="fixed left-0 top-0 z-50 flex h-[50px] w-full items-center  justify-center bg-white/70 backdrop-blur-sm md:static md:mb-4 md:block md:h-auto md:w-auto md:bg-transparent md:p-0 md:text-lg md:font-semibold md:text-[#5F51D9]"
              >
                <Link href={"/dashboard"} className="inline-block">
                  <Image src="/images/logo.png" alt="MalangEE Logo" width={100} height={50} />
                </Link>
              </div>
              <div className="flex w-full items-center justify-center md:justify-start">
                <MalangEE size={120} />
              </div>
            </>
            {leftChildren && (
              <div
                id="sv-left-children"
                className="flex w-full min-w-[270px] items-center justify-center md:w-full md:items-start md:justify-start"
              >
                <div className="flex w-full flex-col items-center space-y-2 text-center md:w-full md:items-start md:text-left">
                  {leftChildren}
                </div>
              </div>
            )}
          </div>

          {/* Right Content Section */}
          <div
            className={`flex items-start justify-center gap-6 md:items-center ${colSpans[rightColSpan] || "md:col-span-6"} ${rightClassName}`}
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
