"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Button, MalangEE } from "@/shared/ui";
import { useGetChatSession } from "@/features/chat/api/use-chat-sessions";

// 초기 sessionId를 가져오는 함수 (클라이언트 전용)
function getInitialSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("chatSessionId");
}

export default function ChatCompletePage() {
  const router = useRouter();

  // 컴포넌트 마운트 시점에 sessionId 결정 (effect 없이)
  const sessionId = useMemo(() => getInitialSessionId(), []);

  // 세션 상세 정보 조회
  const { data: sessionDetail, isLoading } = useGetChatSession(sessionId);

  // 세션 정보에서 직접 duration 값 추출 (상태 없이)
  const totalDuration = sessionDetail?.total_duration_sec ?? 0;
  const userSpeakDuration = sessionDetail?.user_speech_duration_sec ?? 0;

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
    // 세션 ID 정리
    localStorage.removeItem("chatSessionId");

    // 대시보드로 이동
    router.push("/dashboard");
  };

  // 초를 "00시간 00분 00초" 형식으로 변환
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    return `${String(hours).padStart(2, "0")}시간 ${String(mins).padStart(2, "0")}분 ${String(secs).padStart(2, "0")}초`;
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

      {/* Stats - 스크린샷에 맞는 단순한 레이아웃 */}
      <div className="mb-8 w-full max-w-sm text-center">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-gray-600">총 대화 시간</span>
            <span className="text-sm font-semibold text-gray-900">{formatTime(totalDuration)}</span>
          </div>
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-gray-600">내가 말한 시간</span>
            <span className="text-sm font-semibold text-gray-900">{formatTime(userSpeakDuration)}</span>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 w-full max-w-sm">
        <Button
          onClick={handleGoHome}
          variant="primary"
          size="lg"
          fullWidth
        >
          처음으로 돌아가기
        </Button>
      </div>
    </>
  );
}
