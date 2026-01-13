"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, MalangEE } from "@/shared/ui";
import "@/shared/styles/scenario.css";
import { FullLayout } from "@/shared/ui/FullLayout";

// 목소리 옵션 타입
interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

const voiceOptions: VoiceOption[] = [
  { id: "voice-a", name: "목소리 A", description: "부드럽고 친근한 톤" },
  { id: "voice-b", name: "목소리 B", description: "명랑하고 활기찬 톤" },
  { id: "voice-c", name: "목소리 C", description: "차분하고 전문적인 톤" },
  { id: "voice-d", name: "목소리 D", description: "따뜻하고 편안한 톤" },
];

export default function VoiceSelectionPage() {
  const router = useRouter();
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState(0);
  const [textOpacity, setTextOpacity] = useState(1);

  const handlePrevVoice = () => {
    setCurrentVoiceIndex((prev) =>
      prev === 0 ? voiceOptions.length - 1 : prev - 1
    );
  };

  const handleNextVoice = () => {
    setCurrentVoiceIndex((prev) =>
      prev === voiceOptions.length - 1 ? 0 : prev + 1
    );
  };

  const handleStartChat = () => {
    setTextOpacity(0);

    setTimeout(() => {
      // 선택한 목소리를 세션 스토리지에 저장
      sessionStorage.setItem("selectedVoice", voiceOptions[currentVoiceIndex].id);
      router.push("/chat/conversation");
    }, 300);
  };

  const currentVoice = voiceOptions[currentVoiceIndex];

  return (
    <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
      {/* Character */}
      <div className="character-box">
        <MalangEE size={150} />
      </div>

      {/* Text Group */}
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="scenario-title">말랭이 목소리 톤을 선택해 주세요.</h1>
      </div>

      {/* Voice Carousel */}
      <div className="mt-4 w-full max-w-md">
        <div className="flex items-center justify-center gap-6">
          {/* Previous Button */}
          <button
            onClick={handlePrevVoice}
            className="flex h-10 w-10 items-center justify-center text-gray-400 transition-all hover:text-gray-600"
            aria-label="이전 목소리"
          >
            <ChevronLeft size={32} strokeWidth={2.5} />
          </button>

          {/* Voice Display */}
          <div className="flex flex-1 flex-col items-center gap-3 py-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900">{currentVoice.name}</h2>
            <p className="text-sm text-gray-500">{currentVoice.description}</p>

            {/* Indicator Dots */}
            <div className="mt-2 flex justify-center gap-2">
              {voiceOptions.map((_, index) => (
                <div
                  key={index}
                  className={`h-3 rounded-full transition-all ${
                    index === currentVoiceIndex ? "w-10 bg-[#7B6CF6]" : "w-3 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextVoice}
            className="flex h-10 w-10 items-center justify-center text-gray-400 transition-all hover:text-gray-600"
            aria-label="다음 목소리"
          >
            <ChevronRight size={32} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Start Button */}
      <div className="mt-10 w-full max-w-md">
        <Button
          onClick={handleStartChat}
          className="h-14 w-full rounded-full bg-[#7666f5] text-base font-semibold text-white shadow-[0_10px_30px_rgba(118,102,245,0.35)] transition hover:bg-[#6758e8] disabled:opacity-60"
        >
          대화 시작하기
        </Button>
      </div>
    </FullLayout>
  );
}

