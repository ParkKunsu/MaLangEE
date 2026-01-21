"use client";

import { type FC, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/shared/lib/utils";

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  sampleUrl?: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
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

export interface SettingsPopupProps {
  /** 팝업 열림 여부 */
  isOpen: boolean;
  /** 팝업 닫기 핸들러 */
  onClose: () => void;
  /** 자막 표시 여부 */
  showSubtitle: boolean;
  /** 자막 토글 핸들러 */
  onSubtitleChange: (enabled: boolean) => void;
  /** 선택된 목소리 ID */
  selectedVoice: string;
  /** 목소리 변경 핸들러 */
  onVoiceChange: (voiceId: string) => void;
  /** 커스텀 클래스 */
  className?: string;
}

/**
 * 설정 변경하기 팝업 컴포넌트
 * 자막 여부와 목소리 설정을 변경할 수 있음
 */
export const SettingsPopup: FC<SettingsPopupProps> = ({
  isOpen,
  onClose,
  showSubtitle,
  onSubtitleChange,
  selectedVoice,
  onVoiceChange,
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVoiceIndex = VOICE_OPTIONS.findIndex((v) => v.id === selectedVoice);
  const currentVoice = VOICE_OPTIONS[currentVoiceIndex >= 0 ? currentVoiceIndex : 0];

  useEffect(() => {
    // 클라이언트 사이드 마운트 확인 (createPortal을 위한 필수 패턴)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePrevVoice = () => {
    stopSample();
    const newIndex = currentVoiceIndex <= 0 ? VOICE_OPTIONS.length - 1 : currentVoiceIndex - 1;
    onVoiceChange(VOICE_OPTIONS[newIndex].id);
  };

  const handleNextVoice = () => {
    stopSample();
    const newIndex = currentVoiceIndex >= VOICE_OPTIONS.length - 1 ? 0 : currentVoiceIndex + 1;
    onVoiceChange(VOICE_OPTIONS[newIndex].id);
  };

  const stopSample = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative mx-4 w-full max-w-sm",
          "rounded-[24px] border border-white/60",
          "bg-white/95 shadow-[0_20px_80px_rgba(123,108,246,0.25)]",
          "backdrop-blur-2xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6 px-6 py-6">
          {/* 타이틀 */}
          <h2 className="text-center text-lg font-bold text-[#1F1C2B]">설정 변경하기</h2>

          {/* 설정 항목들 */}
          <div className="space-y-4">
            {/* 자막 설정 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">말랭이 대답 자막</span>
              <button
                type="button"
                role="switch"
                aria-checked={showSubtitle}
                onClick={() => onSubtitleChange(!showSubtitle)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                  showSubtitle ? "bg-brand" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    showSubtitle ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* 목소리 설정 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">목소리 변경하기</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevVoice}
                  className="flex h-6 w-6 items-center justify-center text-gray-400 transition-all hover:text-gray-600"
                  aria-label="이전 목소리"
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
                <span className="min-w-[70px] text-center text-sm font-medium text-gray-900">
                  {currentVoice.name}
                </span>
                <button
                  onClick={handleNextVoice}
                  className="flex h-6 w-6 items-center justify-center text-gray-400 transition-all hover:text-gray-600"
                  aria-label="다음 목소리"
                >
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <Button variant="primary" size="md" fullWidth onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export interface SettingsTriggerProps {
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 커스텀 클래스 */
  className?: string;
}

/**
 * 설정 변경하기 트리거 버튼
 */
export const SettingsTrigger: FC<SettingsTriggerProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700",
        className
      )}
    >
      <Settings size={16} />
      <span>설정 변경하기</span>
    </button>
  );
};
