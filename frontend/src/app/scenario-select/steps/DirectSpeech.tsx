"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, ChatMicButton } from "@/shared/ui";
import { useAuth } from "@/features/auth";
import { Volume2, VolumeX } from "lucide-react";
import type { ScenarioChatStateNew } from "@/features/chat/hook/useScenarioChatNew";
import { isDev } from "@/shared/lib/debug";
import { debugLog } from "@/shared/lib/debug";

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
  chatState: Pick<ScenarioChatStateNew, 'isConnected' | 'isRecording'>; // 주제 정하기 상태
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
  chatState,
  connect,
  startScenarioSession,
  hasStarted,
  setHasStarted,
  isMuted,
  setIsMuted,
  toggleMute,
  onShowTopicSuggestion,
}: DirectSpeechProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.nickname || "나";

  // 자막 표시 상태 (기본값: true)
  const [showSubtitle, setShowSubtitle] = useState(true);

  // 연결 성공 여부 추적 (연결 중 vs 에러 구분용)
  const wasConnectedRef = useRef(false);

  // 연결 상태 추적
  useEffect(() => {
    if (chatState.isConnected) {
      wasConnectedRef.current = true;
    }
  }, [chatState.isConnected]);

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

  // 음소거 토글 핸들러
  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    toggleMute(newMuteState);
    debugLog(`[Mute Toggle] ${newMuteState ? 'Muted' : 'Unmuted'}`);
  };

  // 상황별 메시지 정의 (우선순위 순서)
  const messageStates = [
    // 🔴 에러 상태 (최우선)
    {
      condition: () => hasStarted && !chatState.isConnected && wasConnectedRef.current,
      title: "연결에 문제가 있어요",
      desc: "잠시 후 다시 시도해주세요",
    },

    // 🟢 시나리오 완료 → 대화 전환 (중요한 전환점)
    {
      condition: () => phase === "conversation",
      title: "좋아요! 상황을 파악했어요\n잠시만 기다려주세요",
      desc: "곧 연습을 시작할게요!",
    },

    // 🟡 사용자 피드백 필요
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

    // 🔵 정상 대화 상태
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
    /*{
      // 마이크 꺼진 상태 (연결은 되어 있지만 마이크 off)
      condition: () => hasStarted && chatState.isConnected && !isListening && !isAiSpeaking,
      title: "마이크를 다시 눌러\n이어서 말해보세요",
      desc: "언제든 다시 시작할 수 있어요",
    },
    */

    // ⚪ 초기 상태
    {
      condition: () => hasStarted && !chatState.isConnected && !wasConnectedRef.current,
      title: "말랭이와 연결하고 있어요",
      desc: "잠시만 기다려주세요",
    },
    {
      // 기본값 (연결 완료 후 AI 준비 중 등)
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

  const getMainTitle = () => currentMessage.title;
  const getSubDesc = () => currentMessage.desc;

  const handleMicClick = () => {
    // phase가 conversation이면 실행하지 않음 (대화 진행 중)
    if (phase === "conversation") return;

    initAudio();
    resetTimers();
    setTextOpacity(0);
    setTimeout(() => {
      if (!chatState.isConnected) {
        // 1. 첫 클릭 시: 연결 시작
        connect();
        setHasStarted(true);
        // 연결 후 자동으로:
        // - ready 이벤트 발생
        // - startScenarioSession() 호출 (AI 인사말)
        // - AI 발화 후 자동으로 마이크 시작 (page.tsx useEffect)
      } else if (isListening) {
        // 2. 마이크 켜진 상태에서 클릭: 마이크 끄기
        stopRecording();
        setIsListening(false);
      } else {
        // 3. 마이크 꺼진 상태에서 클릭: 마이크 켜기
        startRecording();
        setIsListening(true);
      }
      setTextOpacity(1);
    }, 300);
  };

  const handleStartChat = () => {
    router.push("/chat/conversation");
  };

  return (
    <div id="step-1" className="flex w-full flex-col items-center">
      <div id="split_view" className="flex w-full flex-col items-center gap-6">
        {/* Area 1: 안내 메시지 및 마이크 (상단) */}
        <div id="area-1" className="flex w-full flex-col items-center transition-all duration-300">
          <div className="relative flex min-h-[120px] w-full flex-col items-center justify-center">
            {/* 텍스트 영역 (AI 발화 또는 안내 메시지) */}
            <div className="text-group text-center" style={{ opacity: textOpacity }}>
              <h1 className="scenario-title whitespace-pre-line">
                {getMainTitle()}
              </h1>
              <p className="scenario-desc">
                {getSubDesc()}
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
          <div className="flex items-center gap-3">
            {/* 추천 주제 보기 버튼 (대화 시작 전에만 표시) */}
            {!hasStarted && (
              <button
                onClick={onShowTopicSuggestion}
                className="text-text-secondary hover:text-brand flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium transition-colors"
              >
                추천 주제 보기
              </button>
            )}

            {/* 음소거 토글 버튼 */}
            <button
              onClick={handleMuteToggle}
              className="text-text-secondary hover:text-brand flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!chatState.isConnected || !chatState.isRecording}
            >
              {isMuted ? (
                <>
                  <VolumeX size={14} />
                  음소거 해제
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  음소거
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
