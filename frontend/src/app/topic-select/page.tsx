"use client";

import Image from "next/image";
import { useState } from "react";
import { AuthGuard } from "@/features/auth";
import { Mic } from "lucide-react";
import { MalangEE } from "@/shared/ui";

export default function TopicSelectPage() {
  const [isRecording, setIsRecording] = useState(false);

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // TODO: 음성 녹음 로직 구현
  };

  const handleEndConversation = () => {
    // TODO: 대화 종료 로직 구현
    console.log("대화 종료");
  };

  return (
    <AuthGuard>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gradient-purple to-gradient-blue">
        {/* 배경 장식 원형들 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[15%] h-32 w-32 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute right-[15%] top-[25%] h-24 w-24 rounded-full bg-[#f8f0ff] blur-2xl" />
          <div className="absolute bottom-[20%] left-[20%] h-28 w-28 rounded-full bg-[#fdf4c7] opacity-60 blur-3xl" />
          <div className="absolute bottom-[30%] right-[10%] h-20 w-20 rounded-full bg-[#d5c7ff] opacity-70 blur-2xl" />
          <div className="absolute left-[5%] top-[60%] h-16 w-16 rounded-full bg-[#eecbff] opacity-70 blur-xl" />
          <div className="absolute bottom-[10%] right-[5%] h-24 w-24 rounded-full bg-[#c6d5ff]/50 blur-3xl" />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative flex min-h-screen flex-col">
          {/* 헤더 */}
          <header className="flex items-center justify-between px-8 py-6 md:px-12">
            <div
              className="text-xl font-semibold text-brand"
              style={{ letterSpacing: "-0.3px" }}
            >
              <img src={"/images/logo.png"} alt="MalangEE Logo" />
            </div>
            <button
              onClick={handleEndConversation}
              className="text-sm font-medium text-text-secondary transition hover:text-brand"
              style={{ letterSpacing: "-0.1px" }}
            >
              대화 종료하기
            </button>
          </header>

          {/* 중앙 콘텐츠 */}
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
            {/* 카드 컨테이너 */}
            <div className="relative w-full max-w-[640px] overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 shadow-[0_20px_80px_rgba(125,106,246,0.25)] backdrop-blur-2xl">
              {/* 카드 내부 장식 */}
              <div className="absolute -left-12 top-12 h-28 w-28 rounded-full bg-[#f6e8ff] blur-3xl" />
              <div className="absolute right-10 top-6 h-16 w-16 rounded-full bg-[#fdf4c7] blur-2xl" />

              <div className="relative flex flex-col items-center gap-8 px-8 py-12 md:px-16 md:py-16">
                {/* 마스코트 */}
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#fdf4c7]/30 blur-xl" />
                  <MalangEE size={128} />
                </div>

                {/* 제목 */}
                <div className="space-y-3 text-center">
                  <h1
                    className="text-2xl font-bold leading-snug text-text-primary md:text-3xl"
                    style={{ letterSpacing: "-0.5px" }}
                  >
                    어떤 상황을 연습하고 싶은지
                    <br />
                    편하게 말해보세요.
                  </h1>
                  <p
                    className="text-base text-text-secondary md:text-lg"
                    style={{ letterSpacing: "-0.2px" }}
                  >
                    마이크를 누른 바로 시작해요
                  </p>
                </div>

                {/* 마이크 버튼 */}
                <button
                  onClick={handleMicClick}
                  className={`
                    group relative flex h-24 w-24 items-center justify-center rounded-full
                    shadow-[0_10px_40px_rgba(118,102,245,0.4)]
                    transition-all duration-300
                    ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-brand hover:bg-brand/90"
                    }
                  `}
                  aria-label={isRecording ? "녹음 중지" : "녹음 시작"}
                >
                  {/* 펄스 애니메이션 (녹음 중일 때) */}
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
                      <div className="absolute inset-0 animate-pulse rounded-full bg-red-300 opacity-50" />
                    </>
                  )}

                  {/* 마이크 아이콘 */}
                  <Mic
                    className={`
                      relative h-10 w-10 text-white transition-transform
                      ${isRecording ? "scale-110" : "group-hover:scale-110"}
                    `}
                    strokeWidth={2.5}
                  />
                </button>

                {/* 녹음 상태 텍스트 */}
                {isRecording && (
                  <p
                    className="animate-pulse text-sm font-medium text-red-500"
                    style={{ letterSpacing: "-0.1px" }}
                  >
                    듣고 있어요...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
