"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, ChatMicButton } from "@/shared/ui";
import { useAuth } from "@/features/auth";
import { Captions, CaptionsOff, Volume2, VolumeX } from "lucide-react";
import { ScenarioState } from "@/features/chat/hook";
import { isDev } from "@/shared/lib/debug";
import { debugLog } from "@/shared/lib/debug";

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
  chatState: ScenarioState; // 주제 정하기 상태
  connect: () => void;
  startScenarioSession: () => void;
  hasStarted: boolean;
  setHasStarted: (value: boolean) => void;
  toggleMute: (muted: boolean) => void;
}

export function Step1({
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
  toggleMute,
}: Step1Props) {
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.nickname || "나";

  // 자막 표시 상태 (기본값: true)
  const [showSubtitle, setShowSubtitle] = useState(true);

  // 음소거 상태
  const [isMuted, setIsMuted] = useState(false);

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
    {
      // 1. 연결 끊김 에러 (한 번이라도 연결됐다가 끊긴 경우)
      condition: () => hasStarted && !chatState.isConnected && wasConnectedRef.current,
      title: "연결에 문제가 있어요",
      desc: "잠시 후 다시 시도해주세요"
    },
    {
      // 2. 비활성 상태 (사용자 응답 없음)
      condition: () => showInactivityMessage,
      title: "말랭이가 대답을 기다리고 있어요",
      desc: "Cheer up!"
    },
    {
      // 3. 이해 못함 상태
      condition: () => showNotUnderstood,
      title: "말랭이가 잘 이해하지 못했어요",
      desc: "다시 한번 말씀해 주시겠어요?"
    },
    {
      // 4. 시나리오 선택 완료
      condition: () => phase === "conversation",
      title: "좋아요! 상황을 파악했어요\n잠시만 기다려주세요",
      desc: "곧 연습을 시작할게요!"
    },
    {
      // 5. AI 발화 중
      condition: () => isAiSpeaking,
      title: "말랭이가 질문하고 있어요",
      desc: "잘 들어보세요"
    },
    {
      // 6. 사용자 발화 중 (마이크 켜짐)
      condition: () => isListening && hasStarted,
      title: "어떤 상황을 연습하고 싶은지\n편하게 말해보세요",
      desc: "말랭이가 듣고 있어요"
    },
    {
      // 7. 마이크 꺼진 상태 (연결은 되어 있음)
      condition: () => hasStarted && chatState.isConnected && !isListening && !isAiSpeaking,
      title: "마이크를 다시 눌러\n이어서 말해보세요",
      desc: "언제든 다시 시작할 수 있어요"
    },
    {
      // 8. 연결 중 (아직 연결된 적 없음)
      condition: () => hasStarted && !chatState.isConnected && !wasConnectedRef.current,
      title: "말랭이와 연결하고 있어요",
      desc: "잠시만 기다려주세요"
    },
    {
      // 9. 대기 중 (초기 상태)
      condition: () => true, // 기본값
      title: "어떤 상황을 연습하고 싶은지\n편하게 말해보세요",
      desc: "마이크를 누르면 바로 시작돼요"
    }
  ];

  const getCurrentMessage = () => {
    return messageStates.find(state => state.condition()) || messageStates[messageStates.length - 1];
  };

  const getMainTitle = () => getCurrentMessage().title;
  const getSubDesc = () => getCurrentMessage().desc;

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

  const hasSubtitleContent = showSubtitle && (aiMessage || userTranscript);

  return (
    <div id="step-1" className="flex w-full flex-col items-center">
      <div id="split_view" className="flex w-full flex-col items-center gap-6">
        {/* Area 1: 안내 메시지 및 마이크 (상단) */}
        <div id="area-1" className="flex w-full flex-col items-center transition-all duration-300">
          <div className="relative flex min-h-[120px] w-full flex-col items-center justify-center">
            {/* 텍스트 영역 (안내 메시지) */}
            <div className="text-group text-center" style={{ opacity: textOpacity }}>
              <h1 className="scenario-title whitespace-pre-line">{getMainTitle()}</h1>
              <p className="scenario-desc">{getSubDesc()}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <ChatMicButton
              state={chatState}
              hasStarted={hasStarted}
              isListening={isListening}
              onClick={handleMicClick}
              className={phase === "conversation" ? "pointer-events-none opacity-50" : ""}
            />

            <div className="flex items-center gap-3">
              {/* 자막 토글 버튼 (개발 환경에서만 표시) */}
              {isDev() && (
                <button
                  onClick={toggleSubtitle}
                  className="text-text-secondary hover:text-brand flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium transition-colors"
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

        {/* Area 2: 자막 영역 (하단, 내용이 있을 때만 표시) */}
        {hasSubtitleContent && (
          <div
            id="area-2"
            className="animate-in fade-in slide-in-from-bottom-4 flex w-full justify-center duration-300"
          >
            <div
              id="transcript-box"
              className="inline-block  w-full max-w-md px-6 py-6 text-center"
            >
              <div className="flex flex-col gap-3">
                {/* 1. 말랭이 영어 대화 */}
                {aiMessage && (
                  <div className="flex flex-col gap-1">
                    <p className="text-brand text-left text-xs font-bold">MalangEE</p>
                    <p className="text-text-primary text-left text-sm font-semibold leading-relaxed">
                      {aiMessage}
                    </p>
                  </div>
                )}

                {/* 2. 한글 번역 */}
                {aiMessageKR && (
                  <p className="text-text-secondary border-brand/30 pl-1 text-left text-[12px] leading-tight">
                    {aiMessageKR}
                  </p>
                )}

                {/* 3. 사용자 (닉네임 또는 나) */}
                {userTranscript && (
                  <div className="border-white-70 mt-2 border-t pt-3">
                    <p className="text-text-secondary mb-1 text-right text-xs font-medium">
                      {userName}
                    </p>
                    <p className="text-text-primary text-right text-[12px] italic">
                      {userTranscript}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
