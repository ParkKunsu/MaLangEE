import React, { useEffect } from "react";
import Image from "next/image";
import { GlassCard } from "./GlassCard";

interface SplitViewLayoutProps {
  leftChildren?: React.ReactNode;
  rightChildren: React.ReactNode;
  maxWidth?: string; // 최대 넓이 (예: 'md:max-w-[350px]') - 제공되면 기본 반응형 설정 무시
  bgClass?: string; // body에 적용할 배경 클래스 (예: 'bg-login-01')
  leftColSpan?: number; // 왼쪽 영역의 너비 비율 (1-11, 기본값 4)
  rightColSpan?: number; // 오른쪽 영역의 너비 비율 (1-11, 기본값 8)
  showHeader?: boolean; // GlassCard의 header 표시 여부 (기본값 true)
}

export const SplitViewLayout = ({
  leftChildren,
  rightChildren,
  maxWidth = "md:max-w-[70vw]", // 기본값 없음
  bgClass = "bg-login-01", // 기본값
  leftColSpan = 4, // 기본값 4/12
  rightColSpan = 8, // 기본값 8/12
  showHeader = true, // 기본값 true
}: SplitViewLayoutProps) => {
  useEffect(() => {
    // body에 배경 클래스 적용
    document.body.classList.add(bgClass);

    // cleanup: 컴포넌트 언마운트 시 클래스 제거
    return () => {
      document.body.classList.remove(bgClass);
    };
  }, [bgClass]);

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div
        className={
          maxWidth
            ? `w-full sm:w-[90vw] ${maxWidth}`
            : `w-full sm:w-[90vw] md:min-w-[960px] md:max-w-[70vw]`
        }
      >
        <div className="mx-auto flex w-full gap-8">
          {/* Left Content Section */}
          <div
            className="flex flex-col items-start justify-center gap-6 overflow-y-auto"
            style={{ flex: `0 0 ${(leftColSpan / 12) * 100}%` }}
          >
            <>
              <div className="text-lg font-semibold text-[#5F51D9]">
                <img src={"/images/logo.png"} alt="MalangEE Logo" width={100} height={"auto"} />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-center">
                  <Image
                    src="/images/malangee.gif"
                    alt="MalangEE"
                    width={150}
                    height={150}
                    priority
                    className="object-contain"
                  />
                </div>
              </div>
            </>
            {leftChildren && <div className="space-y-2">{leftChildren}</div>}
          </div>

          {/* Right Content Section */}
          <div
            className="flex items-center justify-center overflow-hidden"
            style={{ flex: `0 0 ${(rightColSpan / 12) * 100}%` }}
          >
            <GlassCard withBackground={false} showHeader={showHeader} className="w-full">
              {rightChildren}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};
