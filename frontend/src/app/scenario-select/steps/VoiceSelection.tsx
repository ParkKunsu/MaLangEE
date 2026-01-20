"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { debugError } from "@/shared/lib/debug";

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  sampleUrl: string;
}

interface VoiceSelectionProps {
  textOpacity: number;
  onNext: () => void;
}

const voiceOptions: VoiceOption[] = [
  {
    id: "echo",
    name: "Echo",
    description: "차분하고 안정적인 남성 목소리",
    sampleUrl: "https://cdn.openai.com/API/docs/audio/echo.wav",
  },
  {
    id: "shimmer",
    name: "Shimmer",
    description: "따뜻하고 편안한 여성 목소리",
    sampleUrl: "https://cdn.openai.com/API/docs/audio/shimmer.wav",
  },
  {
    id: "alloy",
    name: "Alloy",
    description: "부드럽고 친근한 중성 목소리",
    sampleUrl: "https://cdn.openai.com/API/docs/audio/alloy.wav",
  },
  {
    id: "nova",
    name: "Nova",
    description: "명랑하고 활기찬 여성 목소리",
    sampleUrl: "https://cdn.openai.com/API/docs/audio/nova.wav",
  },
];

export function VoiceSelection({ textOpacity, onNext }: VoiceSelectionProps) {
  const router = useRouter();
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentVoice = voiceOptions[currentVoiceIndex];

  const handlePrev = () => {
    stopSample();
    setCurrentVoiceIndex((prev) => (prev === 0 ? voiceOptions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    stopSample();
    setCurrentVoiceIndex((prev) => (prev === voiceOptions.length - 1 ? 0 : prev + 1));
  };

  const playSample = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(currentVoice.sampleUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);

    audio.play().catch(err => {
      debugError("Audio play failed:", err);
      setIsPlaying(false);
    });
  };

  const stopSample = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    stopSample();
    const selectedVoice = currentVoice?.id || "alloy";
    localStorage.setItem("selectedVoice", selectedVoice);
    router.push("/chat/conversation");
  };

  return (
    <div id="step-3" className="flex flex-col items-center w-full">
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="scenario-title">말랭이 목소리 톤을 선택해 주세요.</h1>
      </div>

      <div className="mt-4 w-full max-w-md">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handlePrev}
            className="flex h-10 w-10 items-center justify-center text-gray-400 transition-all hover:text-gray-600 cursor-pointer"
            aria-label="이전 목소리"
          >
            <ChevronLeft size={32} strokeWidth={2.5} />
          </button>

          <div className="flex flex-1 flex-col items-center gap-3 py-4 text-center">
            <h2 className="text-3xl font-bold text-text-primary">{currentVoice.name}</h2>
            <p className="text-sm text-text-secondary">{currentVoice.description}</p>

            {/* 미리듣기 버튼 */}
            <button
              onClick={isPlaying ? stopSample : playSample}
              className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                isPlaying 
                  ? "bg-brand text-white" 
                  : "bg-brand-50 text-brand hover:bg-brand-200"
              }`}
            >
              <Volume2 size={16} className={isPlaying ? "animate-pulse" : ""} />
              {isPlaying ? "재생 중..." : "미리듣기"}
            </button>

            <div className="mt-4 flex justify-center gap-2">
              {voiceOptions.map((_, index) => (
                <div
                  key={index}
                  className={`h-3 rounded-full transition-all ${
                    index === currentVoiceIndex ? "w-10 bg-brand" : "w-3 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="flex h-10 w-10 items-center justify-center text-gray-400 transition-all hover:text-gray-600 cursor-pointer"
            aria-label="다음 목소리"
          >
            <ChevronRight size={32} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="mt-10 w-full max-w-md">
        <Button
          onClick={handleNextStep}
          variant="primary"
          size="lg"
          fullWidth
        >
          대화 시작하기
        </Button>
      </div>
    </div>
  );
}
