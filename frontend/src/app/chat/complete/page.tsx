"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Clock, Mic } from "lucide-react";
import { Button, MalangEE } from "@/shared/ui";
import { FullLayout } from "@/shared/ui/FullLayout";
import "@/shared/styles/scenario.css";

export default function ChatCompletePage() {
  const router = useRouter();

  // 초기값을 함수로 설정하여 한 번만 실행
  const getInitialTotalDuration = () => {
    if (typeof window === "undefined") return 180;
    const total = sessionStorage.getItem("totalChatDuration");
    return total ? parseInt(total) : 180; // 3분
  };

  const getInitialUserSpeakDuration = () => {
    if (typeof window === "undefined") return 90;
    const userSpeak = sessionStorage.getItem("userSpeakDuration");
    return userSpeak ? parseInt(userSpeak) : 90; // 1분 30초
  };

  const [totalDuration, setTotalDuration] = useState(getInitialTotalDuration);
  const [userSpeakDuration, setUserSpeakDuration] = useState(getInitialUserSpeakDuration);

  const handleGoHome = () => {
    // 세션 데이터 정리
    sessionStorage.removeItem("totalChatDuration");
    sessionStorage.removeItem("userSpeakDuration");

    // 새로운 대화 시작 페이지로 이동
    router.push("/chat/welcome-back");
  };

  // 초를 분:초 형식으로 변환
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  return (
    <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
      {/* Character */}
      <div className="character-box">
        <MalangEE size={150} />
      </div>

      {/* Main Message */}
      <div className="text-group mb-8 text-center">
        <h1 className="scenario-title">오늘도 잘 말했어요!</h1>
      </div>

      {/* Stats Card */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-8 text-center">
          {/* Total Duration */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-7 w-7 text-blue-600" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <p className="mb-1 text-sm font-medium text-gray-600">총 대화 시간</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(totalDuration)}</p>
            </div>
          </div>

          {/* User Speak Duration */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <Mic className="h-7 w-7 text-green-600" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <p className="mb-1 text-sm font-medium text-gray-600">내가 말한 시간</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(userSpeakDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="mt-4">
      <div className="flex w-full justify-center">
        <Button
          onClick={handleGoHome}
          className="h-14 w-[40%] min-w-[280px] rounded-full bg-[#7666f5] text-lg font-semibold text-white shadow-[0_10px_30px_rgba(118,102,245,0.35)] transition-all hover:bg-[#6758e8]"
        >
          처음으로 돌아가기
        </Button>
      </div>
      </div>

      {/* Test Links */}
      <div className="mt-8 flex flex-col items-center gap-2 border-t pt-4">
        <p className="mb-1 text-xs font-bold text-gray-600">🔧 테스트 링크</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTotalDuration(120);
              setUserSpeakDuration(60);
            }}
            className="rounded-full bg-blue-100 px-3 py-1 text-xs transition hover:bg-blue-200"
          >
            2분 대화
          </button>
          <button
            onClick={() => {
              setTotalDuration(300);
              setUserSpeakDuration(180);
            }}
            className="rounded-full bg-green-100 px-3 py-1 text-xs transition hover:bg-green-200"
          >
            5분 대화
          </button>
          <button
            onClick={() => {
              setTotalDuration(600);
              setUserSpeakDuration(420);
            }}
            className="rounded-full bg-purple-100 px-3 py-1 text-xs transition hover:bg-purple-200"
          >
            10분 대화
          </button>
        </div>
      </div>
    </FullLayout>
  );
}

