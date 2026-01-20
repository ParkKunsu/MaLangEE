"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, ChatMicButton } from "@/shared/ui";
import { useAuth } from "@/features/auth";
import type { ScenarioChatStateNew } from "@/features/chat/hook/useScenarioChatNew";

interface DirectSpeechProps {
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
  chatState: Pick<ScenarioChatStateNew, 'isConnected' | 'isRecording'>;
  connect: () => void;
  startScenarioSession: () => void;
  hasStarted: boolean;
  setHasStarted: (value: boolean) => void;
  isMuted: boolean;
  setIsMuted: (value: boolean) => void;
  toggleMute: (muted: boolean) => void;
  onShowTopicSuggestion: () => void;
}

export function DirectSpeech({
  textOpacity,
  isListening,
  isAiSpeaking,
  hasError,
  phase,
  showInactivityMessage,
  showNotUnderstood,
  aiMessage,
  aiMessageKR,
  resetTimers,
  startRecording,
  stopRecording,
  setIsListening,
  setTextOpacity,
  initAudio,
  chatState,
  connect,
  setHasStarted,
  hasStarted,
  onShowTopicSuggestion,
}: DirectSpeechProps) {
  const { user } = useAuth();

  // 연결 성공 여부 추적
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (chatState.isConnected) {
      wasConnectedRef.current = true;
    }
  }, [chatState.isConnected]);

  // 상황별 메시지 정의
  const messageStates = [
    {
      condition: () => hasStarted && !chatState.isConnected && wasConnectedRef.current,
      title: "연결에 문제가 있어요",
      desc: "잠시 후 다시 시도해주세요",
    },
    {
      condition: () => phase === "conversation",
      title: "좋아요! 상황을 파악했어요\n잠시만 기다려주세요",
      desc: "곧 연습을 시작할게요!",
    },
    {
      condition: () => showInactivityMessage,
      title: "말랭이가 대답을 기다리고 있어요",
      desc: "Cheer up!",
    },
    {
      condition: () => showNotUnderstood,
      title: "말랭이가 잘 이해하지 못했어요",
      desc: "다시 한번 말씀해 주시겠어요?",
    },
    {
      condition: () => isAiSpeaking,
      title: aiMessage || "말랭이가 질문하고 있어요",
      desc: aiMessageKR || "잘 들어보세요",
    },
    {
      condition: () => isListening && hasStarted,
      title: aiMessage || "말랭이가 듣고 있어요",
      desc: aiMessageKR || "편하게 말해보세요",
    },
    {
      condition: () => hasStarted && !chatState.isConnected && !wasConnectedRef.current,
      title: "말랭이와 연결하고 있어요",
      desc: "잠시만 기다려주세요",
    },
    {
      condition: () => true,
      title: "잠시만 기다려주세요",
      desc: "말랭이가 준비하고 있어요",
    },
  ];

  const currentMessage = useMemo(() => {
    return messageStates.find(state => state.condition()) || messageStates[messageStates.length - 1];
  }, [
    chatState.isConnected,
    wasConnectedRef.current,
    showInactivityMessage,
    showNotUnderstood,
    phase,
    isAiSpeaking,
    aiMessage,
    aiMessageKR,
    isListening,
    hasStarted,
  ]);

  const handleMicClick = () => {
    if (phase === "conversation") return;

    initAudio();
    resetTimers();
    setTextOpacity(0);
    setTimeout(() => {
      if (!chatState.isConnected) {
        connect();
        setHasStarted(true);
      } else if (isListening) {
        stopRecording();
        setIsListening(false);
      } else {
        startRecording();
        setIsListening(true);
      }
      setTextOpacity(1);
    }, 300);
  };

  return (
    <div id="step-1" className="flex w-full flex-col items-center">
      <div id="split_view" className="flex w-full flex-col items-center gap-6">
        <div id="area-1" className="flex w-full flex-col items-center transition-all duration-300">
          <div className="relative flex min-h-[120px] w-full flex-col items-center justify-center">
            <div className="text-group text-center" style={{ opacity: textOpacity }}>
              <h1 className="scenario-title whitespace-pre-line">
                {currentMessage.title}
              </h1>
              <p className="scenario-desc">
                {currentMessage.desc}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <ChatMicButton
              state={{ ...chatState, isAiSpeaking }}
              hasStarted={hasStarted}
              isListening={isListening}
              onClick={handleMicClick}
              className={phase === "conversation" ? "pointer-events-none opacity-50" : ""}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {!hasStarted && (
            <button
              onClick={onShowTopicSuggestion}
              className="text-text-secondary hover:text-brand flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium transition-colors shadow-sm border border-gray-100"
            >
              추천 주제 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
