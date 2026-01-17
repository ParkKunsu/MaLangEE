"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, MalangEE } from "@/shared/ui";

export default function SubtitleSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [textOpacity, setTextOpacity] = useState(1);

  const handleChoice = (withSubtitle: boolean) => {
    setTextOpacity(0);

    setTimeout(() => {
      // 선택 결과를 localStorage에 저장 (sessionStorage → localStorage)
      localStorage.setItem("subtitleEnabled", withSubtitle.toString());

      // sessionId를 URL 쿼리로 전달
      if (sessionId) {
        router.push(`/chat/voice-selection?sessionId=${sessionId}`);
      } else {
        router.push("/chat/voice-selection");
      }
    }, 300);
  };

  return (
    <>
      {/* Character */}
      <div className="character-box">
        <MalangEE size={150} />
      </div>

      {/* Text Group */}
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="scenario-title">말랭이의 답변을 자막으로 볼까요?</h1>
        <p className="scenario-desc">내가 말한 내용은 자막으로 보이지 않아요.</p>
      </div>

      {/* Button Group */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-4">
        <Button
          onClick={() => handleChoice(true)}
          className="h-14 w-full rounded-full bg-[#7666f5] text-base font-semibold text-white shadow-[0_10px_30px_rgba(118,102,245,0.35)] transition hover:bg-[#6758e8] disabled:opacity-60"
        >
          자막 보기
        </Button>
        <Button
          onClick={() => handleChoice(false)}
          variant="outline"
          className="h-14 w-full rounded-full border-2 border-[#7B6CF6] bg-white text-base font-semibold text-[#7B6CF6] transition hover:bg-[#f6f4ff] disabled:opacity-60"
        >
          자막 없이 진행하기
        </Button>
      </div>
    </>
  );
}
