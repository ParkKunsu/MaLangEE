"use client";

import { useRouter } from "next/navigation";
import { Button, MicButton } from "@/shared/ui";

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
      return "다 듣고 나면 마이크를 다시 눌러주세요";
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

  return (
    <div id="step-1" className="flex flex-col items-center w-full">
      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="scenario-title whitespace-pre-line">{getMainTitle()}</h1>
        <p className="scenario-desc">{getSubDesc()}</p>
        {showSpeakingStatus && phase === "conversation" && (
          <p className="scenario-desc mt-1">
            {isAiSpeaking ? "말랭이가 말하고 있어요." : "말하는 중이에요."}
          </p>
        )}
      </div>

      {/* 자막 표시 영역 (AI 메시지 또는 사용자 발화가 있을 때) */}
      {(aiMessage || userTranscript) && (
        <div className="mt-4 px-6 py-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm max-w-[80%] mx-auto text-center">
          {userTranscript && (
            <p className="text-xs text-text-secondary mb-1 italic">나: {userTranscript}</p>
          )}
          {aiMessage && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-text-primary leading-relaxed font-medium">
                말랭이: {aiMessage}
              </p>
              {aiMessageKR && (
                <p className="text-xs text-text-secondary leading-relaxed">
                  ({aiMessageKR})
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <MicButton 
          isListening={isListening} 
          onClick={handleMicClick} 
          size="md" 
          className={phase === "conversation" ? "pointer-events-none opacity-50" : ""}
        />
      </div>

      {phase === "conversation" && (
        <div className="mt-10 w-full max-w-md">
          <Button
            onClick={handleStartChat}
            variant="primary"
            size="lg"
            fullWidth
          >
            대화 시작하기
          </Button>
        </div>
      )}
    </div>
  );
}
