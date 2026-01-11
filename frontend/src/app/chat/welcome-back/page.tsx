"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button } from "@/shared/ui";
import "@/shared/styles/scenario.css";

// 테스트 데이터
const mockUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  nickname: "테스트유저",
};

const mockLastSession = {
  session_id: "session-123",
  title: "영화 리뷰 토론",
  started_at: "2026-01-10T10:00:00Z",
  ended_at: "2026-01-10T10:30:00Z",
  total_duration_sec: 1800,
  user_speech_duration_sec: 900,
  created_at: "2026-01-10T10:00:00Z",
  updated_at: "2026-01-10T10:30:00Z",
  message_count: 25,
};

export default function WelcomeBackPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const user = mockUser;
  const lastSession = mockLastSession;
  const textOpacity = 1;

  // 로딩 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 대화 기록이 없으면 시나리오 선택 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !lastSession) {
      router.push("/auth/scenario-select");
    }
  }, [isLoading, lastSession, router]);

  const handleContinueChat = () => {
    // 텍스트 변경
    setIsConfirmed(true);

    // 1초 후 자막 설정 페이지로 이동
    setTimeout(() => {
      router.push("/chat/subtitle-settings");
    }, 1000);
  };

  const handleNewTopic = () => {
    // 새로운 주제 선택 페이지로 이동
    router.push("/auth/scenario-select");
  };

  if (isLoading) {
    return (
      <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
        <div className="character-box">
          <Image
            src="/images/malangee.svg"
            alt="MalangEE Character"
            width={150}
            height={150}
            priority
          />
        </div>
        <div className="text-group">
          <h1 className="scenario-title">잠시만 기다려주세요...</h1>
        </div>
      </FullLayout>
    );
  }

  return (
    <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
      {/* Character */}
      <div className="character-box">
        <Image
          src="/images/malangee.svg"
          alt="MalangEE Character"
          width={150}
          height={150}
          priority
        />
      </div>

      {/* Text Group */}
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <p className="scenario-desc">{user.nickname}님, 기다리고 있었어요!</p>
        <h1 className="scenario-title">
          {isConfirmed ? (
            <>
              {lastSession.title}을
              <br />
              같이 재현해 볼까요?
            </>
          ) : (
            <> 지난번에 했던
              {lastSession.title},
              <br/>이 주제로 다시 이야기해볼까요?</>
          )}
        </h1>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-4">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={handleContinueChat}
          disabled={isConfirmed}
          isLoading={isConfirmed}
        >
          {isConfirmed ? "시작 중..." : "대화 시작하기"}
        </Button>

        <Button
          variant="outline-purple"
          size="xl"
          fullWidth
          onClick={handleNewTopic}
          disabled={isConfirmed}
        >
          새로운 주제 고르기
        </Button>
      </div>
    </FullLayout>
  );
}
