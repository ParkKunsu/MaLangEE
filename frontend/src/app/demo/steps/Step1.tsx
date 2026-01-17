"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, MicButton } from "@/shared/ui";
import { useAuth } from "@/features/auth";
import { Captions, CaptionsOff } from "lucide-react";

interface Step1Props {
  textOpacity: number;
  isListening: boolean;
  isLocalSpeaking: boolean;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  hasError: boolean;
  phase: "topic" | "conversation";
  showInactivityMessage: boolean;
  showNotUnderstood: boolean;
  aiMessage?: string;
  aiMessageKR?: string;
  userTranscript?: string;
  resetTimers: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  setIsListening: (value: boolean) => void;
  setTextOpacity: (value: number) => void;
  onNext: () => void;
  initAudio: () => void;
}

export function Step1({
  textOpacity,
  isListening,
  isLocalSpeaking,
  isAiSpeaking,
  isUserSpeaking,
  hasError,
  phase,
  showInactivityMessage,
  showNotUnderstood,
  aiMessage,
  aiMessageKR,
  userTranscript,
  resetTimers,
  startRecording,
  stopRecording,
  setIsListening,
  setTextOpacity,
  initAudio,
}: Step1Props) {
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.nickname || "나";
  
  // 자막 표시 상태 (기본값: true)
  const [showSubtitle, setShowSubtitle] = useState(true);

  // 세션 스토리지에서 자막 설정 불러오기
  useEffect(() => {
    const storedSubtitle = sessionStorage.getItem("subtitleEnabled");
    if (storedSubtitle !== null) {
      setShowSubtitle(storedSubtitle === "true");
    }
  }, []);

  const toggleSubtitle = () => {
    const newValue = !showSubtitle;
    setShowSubtitle(newValue);
    sessionStorage.setItem("subtitleEnabled", newValue.toString());
  };

  const getMainTitle = () => {
    if (showInactivityMessage) {
      return "말랭이가 대답을 기다리고 있어요.";
    }

    if (showNotUnderstood) {
      return "말랭이가 잘 이해하지 못했어요.";
    }

    if (phase === "conversation") {
      return "좋아요! 상황을 파악했어요.\n잠시만 기다려주세요.";
    }

    if (hasError) {
      return "연결에 문제가 있어요.";
    }

    if (isListening) {
      return "장소나 상황 또는 키워드로\n" + "말씀해 주세요.";
    }

    return "어떤 상황을 연습하고 싶은지\n" + "편하게 말해보세요.";
  };

  const getSubDesc = () => {
    if (showInactivityMessage) {
      return "Cheer up!";
    }

    if (showNotUnderstood) {
      return "다시 한번 말씀해 주시겠어요?";
    }

    if (phase === "conversation") {
      return "곧 연습을 시작할게요!";
    }

    if (hasError) {
      return "잠시 후 다시 시도해주세요";
    }

    if (isListening) {
      return "말랭이가 듣고 있어요";
    }

    return "마이크를 누르면 바로 시작돼요";
  };

  const handleMicClick = () => {
    initAudio();
    resetTimers();
    setTextOpacity(0);

    setTimeout(() => {
      if (isListening) {
        setIsListening(false);
        stopRecording();
      } else {
        setIsListening(true);
        startRecording();
      }
      setTextOpacity(1);
    }, 300);
  };

  const handleStartChat = () => {
    router.push("/chat/conversation");
  };

  const showSpeakingStatus = isAiSpeaking || isUserSpeaking || isLocalSpeaking;
  const hasSubtitleContent = showSubtitle && (aiMessage || userTranscript);

  return (
    <div id="step-1" className="flex w-full flex-col items-center">
      <div id="split_view" className="flex w-full flex-col gap-6 items-center">
        {/* Area 1: 안내 메시지 및 마이크 (상단) */}
        <div id="area-1" className="flex w-full flex-col items-center transition-all duration-300">
          <div className="relative flex min-h-[120px] w-full flex-col items-center justify-center">
            {/* 텍스트 영역 (안내 메시지) */}
            <div className="text-group text-center" style={{ opacity: textOpacity }}>
              <h1 className="scenario-title whitespace-pre-line">{getMainTitle()}</h1>
              <p className="scenario-desc">{getSubDesc()}</p>
              {showSpeakingStatus && phase === "conversation" && (
                <p className="scenario-desc mt-1">
                  {isAiSpeaking ? "말랭이가 말하고 있어요." : "말하는 중이에요."}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <MicButton
              isListening={isListening}
              onClick={handleMicClick}
              size="md"
              className={phase === "conversation" ? "pointer-events-none opacity-50" : ""}
            />

            {/* 자막 토글 버튼 */}
            <button
              onClick={toggleSubtitle}
              className="text-text-secondary hover:text-brand flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100"
            >
              {showSubtitle ? (
                <>
                  <Captions size={14} />
                  자막 끄기
                </>
              ) : (
                <>
                  <CaptionsOff size={14} />
                  자막 켜기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Area 2: 자막 영역 (하단, 내용이 있을 때만 표시) */}
        {hasSubtitleContent && (
          <div id="area-2" className="flex w-full justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div
              id="transcript-box"
              className="inline-block rounded-3xl border border-white/60 bg-white/90 px-6 py-6 text-center backdrop-blur-md shadow-sm w-full max-w-md"
            >
              <div className="flex flex-col gap-3">
                {/* 1. 말랭이 영어 대화 */}
                {aiMessage && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-brand font-bold text-left">MalangEE</p>
                    <p className="text-text-primary text-sm font-semibold leading-relaxed text-left">
                      {aiMessage}
                    </p>
                  </div>
                )}

                {/* 2. 한글 번역 */}
                {aiMessageKR && (
                  <p className="text-text-secondary text-[12px] leading-tight text-left pl-1 border-l-2 border-brand/30">
                    {aiMessageKR}
                  </p>
                )}

                {/* 3. 사용자 (닉네임 또는 나) */}
                {userTranscript && (
                  <div className="mt-2 pt-3 border-t border-gray-100">
                    <p className="text-xs text-text-secondary text-right mb-1 font-medium">{userName}</p>
                    <p className="text-text-primary text-sm italic text-right">
                      {userTranscript}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {phase === "conversation" && (
        <div className="mt-10 w-full max-w-md">
          <Button onClick={handleStartChat} variant="primary" size="lg" fullWidth>
            대화 시작하기
          </Button>
        </div>
      )}
    </div>
  );
}
