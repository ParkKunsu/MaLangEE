"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Clock, Mic } from "lucide-react";
import { Button, MalangEE } from "@/shared/ui";
import { useGetChatSession } from "@/features/chat/api/use-chat-sessions";

export default function ChatCompletePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [userSpeakDuration, setUserSpeakDuration] = useState(0);

  // 로컬 스토리지에서 sessionId 가져오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSessionId = localStorage.getItem("chatSessionId");
      setSessionId(storedSessionId);
    }
  }, []);

  // 세션 상세 정보 조회
  const { data: sessionDetail, isLoading } = useGetChatSession(sessionId || "");

  // 세션 정보가 로드되면 상태 업데이트
  useEffect(() => {
    if (sessionDetail) {
      // any 타입으로 캐스팅하여 API 응답 구조에 유연하게 대응
      // 실제 API 응답 구조: { total_duration_sec, user_speech_duration_sec, ... }
      const detail = sessionDetail as any;
      setTotalDuration(detail.total_duration_sec || 0);
      setUserSpeakDuration(detail.user_speech_duration_sec || 0);
    }
  }, [sessionDetail]);

  useEffect(() => {
    // 페이지 진입 시 음소거 이벤트 발송
    window.dispatchEvent(new CustomEvent("toggle-mute", { detail: { isMuted: true } }));

    // 컴포넌트 언마운트 시 음소거 해제 (선택 사항, 다른 페이지로 이동 시)
    return () => {
      window.dispatchEvent(new CustomEvent("toggle-mute", { detail: { isMuted: false } }));
    };
  }, []);

  const handleGoHome = () => {
    // 리포트 데이터 정리 (필요하다면)
    localStorage.removeItem("chatReport");
    // 세션 ID 정리 (선택 사항)
    // localStorage.removeItem("chatSessionId");

    // 대시보드로 이동
    router.push("/dashboard");
  };

  // 초를 분:초 형식으로 변환 (반올림 적용)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60); // 초 단위 반올림
    return `${mins}분 ${secs}초`;
  };

  if (isLoading && sessionId) {
    return (
      <>
        <div className="character-box">
          <MalangEE size={150} />
        </div>
        <div className="text-group mb-8 text-center">
          <h1 className="scenario-title">결과를 불러오고 있어요...</h1>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Character */}
      <div className="character-box">
        <MalangEE size={150} />
      </div>

      {/* Main Message */}
      <div className="text-group mb-8 text-center">
        <h1 className="scenario-title">오늘도 잘 말했어요!</h1>
      </div>

      {/* Stats Card */}
      <div className="mb-8 w-full max-w-md">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 text-center">
          {/* Total Duration */}
          <div className="flex items-center gap-4 justify-center md:justify-start md:flex-col md:gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-7 w-7 text-blue-600" strokeWidth={2} />
            </div>
            <div className="flex flex-col items-start md:items-center">
              <p className="mb-1 text-sm font-medium text-gray-600">총 대화 시간</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(totalDuration)}</p>
            </div>
          </div>

          {/* User Speak Duration */}
          <div className="flex items-center gap-4 justify-center md:justify-start md:flex-col md:gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <Mic className="h-7 w-7 text-green-600" strokeWidth={2} />
            </div>
            <div className="flex flex-col items-start md:items-center">
              <p className="mb-1 text-sm font-medium text-gray-600">내가 말한 시간</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(userSpeakDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 w-full max-w-md">
        <div className="flex w-full justify-center">
          <Button
            onClick={handleGoHome}
            className="h-14 w-full rounded-full bg-[#7666f5] text-lg font-semibold text-white shadow-[0_10px_30px_rgba(118,102,245,0.35)] transition-all hover:bg-[#6758e8]"
          >
            처음으로 돌아가기
          </Button>
        </div>
      </div>
    </>
  );
}
