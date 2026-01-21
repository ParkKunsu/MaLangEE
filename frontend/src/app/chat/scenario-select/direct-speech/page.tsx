"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, MalangEE, ChatMicButton, ConfirmPopup, ScenarioResultPopup } from "@/shared/ui";
import "@/shared/styles/scenario.css";
import { useScenarioChatNew } from "@/features/chat/hook/useScenarioChatNew";
import { useInactivityTimer } from "@/shared/hooks";
import { Volume2, VolumeX } from "lucide-react";

export default function DirectSpeechPage() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const [showNotUnderstood, setShowNotUnderstood] = useState(false);
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);
  const [showScenarioResultPopup, setShowScenarioResultPopup] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);

  const {
    showInactivityMessage,
    startInactivityTimer,
    resetTimers: resetInactivityTimers,
  } = useInactivityTimer();

  const notUnderstoodTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPromptSentRef = useRef(false);
  const prevAiSpeakingRef = useRef(false);

  const {
    state: chatState,
    connect,
    disconnect,
    sendText,
    startMicrophone,
    stopMicrophone,
    initAudio,
    startScenarioSession,
    toggleMute,
  } = useScenarioChatNew();

  const hintMessage = "예: 공항 체크인 상황을 연습하고 싶어요.";

  const clearNotUnderstoodTimer = () => {
    if (notUnderstoodTimerRef.current) {
      clearTimeout(notUnderstoodTimerRef.current);
      notUnderstoodTimerRef.current = null;
    }
  };

  // 연결 성공 여부 추적
  useEffect(() => {
    if (chatState.isConnected && !wasConnected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWasConnected(true);
    }
  }, [chatState.isConnected, wasConnected]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearNotUnderstoodTimer();
      disconnect();
    };
  }, [disconnect]);

  // 페이지 진입 시 자동 연결
  useEffect(() => {
    if (!hasStarted && !chatState.isConnected) {
      initAudio();
      connect();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasStarted(true);
    }
  }, [hasStarted, chatState.isConnected, initAudio, connect]);

  // 연결 준비 완료 시 시나리오 세션 시작
  useEffect(() => {
    if (chatState.isReady && !initialPromptSentRef.current) {
      startScenarioSession();
      initialPromptSentRef.current = true;
    }
  }, [chatState.isReady, startScenarioSession]);

  // pendingTopic 처리 (주제 선택 후 이동한 경우)
  useEffect(() => {
    if (chatState.isReady) {
      const pendingTopic = sessionStorage.getItem("pendingTopic");
      if (pendingTopic) {
        sessionStorage.removeItem("pendingTopic");
        sendText(pendingTopic);
      }
    }
  }, [chatState.isReady, sendText]);

  // AI 발화/녹음 상태에 따른 마이크 제어
  useEffect(() => {
    if (chatState.isAiSpeaking && chatState.isRecording) {
      stopMicrophone();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsListening(false);
    }

    if (
      prevAiSpeakingRef.current &&
      !chatState.isAiSpeaking &&
      chatState.isReady &&
      initialPromptSentRef.current &&
      !chatState.isRecording
    ) {
      startMicrophone();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsListening(true);
    }

    prevAiSpeakingRef.current = chatState.isAiSpeaking;
  }, [chatState.isAiSpeaking, chatState.isReady, chatState.isRecording, startMicrophone, stopMicrophone]);

  const resetTimers = useCallback(() => {
    resetInactivityTimers();
    setShowNotUnderstood(false);
  }, [resetInactivityTimers]);

  // 비활성 타이머 관리
  useEffect(() => {
    if (!hasStarted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetTimers();
      return;
    }

    if (chatState.isAiSpeaking || chatState.isRecording) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetTimers();
      return;
    }

    startInactivityTimer();
  }, [chatState.isAiSpeaking, chatState.isRecording, hasStarted, startInactivityTimer, resetTimers]);

  // 시나리오 결과 처리
  useEffect(() => {
    if (chatState.scenarioResult) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetTimers();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsListening(false);
      stopMicrophone();

      if (typeof window !== "undefined") {
        const { conversationGoal, conversationPartner, place } = chatState.scenarioResult;
        if (conversationGoal) localStorage.setItem("conversationGoal", conversationGoal);
        if (conversationPartner) localStorage.setItem("conversationPartner", conversationPartner);
        if (place) localStorage.setItem("place", place);
      }

      setShowScenarioResultPopup(true);
    }
  }, [chatState.scenarioResult, stopMicrophone, resetTimers]);

  // 팝업 표시 시 타이머 리셋
  useEffect(() => {
    if (showScenarioResultPopup || showEndChatPopup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetTimers();
    }
  }, [showScenarioResultPopup, showEndChatPopup, resetTimers]);

  // AI 메시지 수신 시 타이머 초기화
  useEffect(() => {
    if (!chatState.aiMessage) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowNotUnderstood(false);
    clearNotUnderstoodTimer();
  }, [chatState.aiMessage]);

  // 사용자 발화 감지 시 타이머 관리
  useEffect(() => {
    if (!chatState.userTranscript) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowNotUnderstood(false);
    clearNotUnderstoodTimer();
    notUnderstoodTimerRef.current = setTimeout(() => {
      if (!chatState.isAiSpeaking) {
        setShowNotUnderstood(true);
      }
    }, 5000);
  }, [chatState.userTranscript, chatState.isAiSpeaking]);

  const handleStopFromEnd = () => {
    resetTimers();
    setShowEndChatPopup(false);
    setIsListening(false);
    stopMicrophone();
    disconnect();
    router.push("/");
  };

  const handleContinueFromEnd = () => {
    setShowEndChatPopup(false);
    resetTimers();
    startInactivityTimer();
    setIsListening(true);
    startMicrophone();
  };

  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    toggleMute(newMuteState);
  };

  const handleMicClick = () => {
    initAudio();
    resetTimers();
    setTextOpacity(0);
    setTimeout(() => {
      if (!chatState.isConnected) {
        connect();
        setHasStarted(true);
      } else if (isListening) {
        stopMicrophone();
        setIsListening(false);
      } else {
        startMicrophone();
        setIsListening(true);
      }
      setTextOpacity(1);
    }, 300);
  };

  // 상황별 메시지 정의
  const getMessageState = () => {
    if (hasStarted && !chatState.isConnected && wasConnected) {
      return { title: "연결에 문제가 있어요", desc: "잠시 후 다시 시도해주세요" };
    }
    if (showInactivityMessage) {
      return { title: "말랭이가 대답을 기다리고 있어요", desc: "Cheer up!" };
    }
    if (showNotUnderstood) {
      return { title: "말랭이가 잘 이해하지 못했어요", desc: "다시 한번 말씀해 주시겠어요?" };
    }
    if (chatState.isAiSpeaking) {
      return {
        title: chatState.aiMessage || "말랭이가 질문하고 있어요",
        desc: chatState.aiMessageKR || "잘 들어보세요",
      };
    }
    if (isListening && hasStarted) {
      return {
        title: chatState.aiMessage || "말랭이가 듣고 있어요",
        desc: chatState.aiMessageKR || "편하게 말해보세요",
      };
    }
    if (hasStarted && !chatState.isConnected && !wasConnected) {
      return { title: "말랭이와 연결하고 있어요", desc: "잠시만 기다려주세요" };
    }
    return { title: "잠시만 기다려주세요", desc: "말랭이가 준비하고 있어요" };
  };

  const currentMessage = getMessageState();

  return (
    <>
      <div className="character-box relative">
        <MalangEE status={showInactivityMessage ? "humm" : "default"} size={120} />
        {showInactivityMessage && (
          <div className="absolute -bottom-[25px] left-1/2 z-10 -translate-x-1/2">
            <div className="relative rounded-2xl border-2 border-yellow-300 bg-yellow-50 px-6 py-3 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="h-0 w-0 border-b-[12px] border-l-[12px] border-r-[12px] border-b-yellow-300 border-l-transparent border-r-transparent"></div>
                <div className="absolute left-1/2 top-[2px] h-0 w-0 -translate-x-1/2 border-b-[10px] border-l-[10px] border-r-[10px] border-b-yellow-50 border-l-transparent border-r-transparent"></div>
              </div>
              <p className="whitespace-nowrap text-sm text-gray-700">{hintMessage}</p>
            </div>
          </div>
        )}
      </div>

      <div id="direct-speech" className="flex w-full flex-col items-center">
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center transition-all duration-300">
            <div className="relative flex min-h-[120px] w-full flex-col items-center justify-center">
              <div className="text-group text-center" style={{ opacity: textOpacity }}>
                <h1 className="scenario-title whitespace-pre-line">{currentMessage.title}</h1>
                <p className="scenario-desc">{currentMessage.desc}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <ChatMicButton
                state={{ ...chatState, isAiSpeaking: chatState.isAiSpeaking }}
                hasStarted={hasStarted}
                isListening={isListening}
                onClick={handleMicClick}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {!hasStarted && (
              <Button asChild variant="outline-purple" size="md">
                <Link href="/chat/scenario-select">추천 주제 보기</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {hasStarted && (
        <button
          onClick={handleMuteToggle}
          className={`fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${isMuted ? "bg-red-50 text-red-500" : "bg-white text-brand"
            } border border-gray-100`}
          title={isMuted ? "음소거 해제" : "음소거"}
        >
          {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
        </button>
      )}

      {showScenarioResultPopup && chatState.scenarioResult && (
        <ScenarioResultPopup
          scenarioResult={chatState.scenarioResult}
          onConfirm={() => {
            setShowScenarioResultPopup(false);
            router.push("/chat/scenario-select/subtitle-settings");
          }}
          onCancel={() => {
            setShowScenarioResultPopup(false);
            disconnect();
            router.push("/chat/scenario-select");
          }}
        />
      )}

      {showEndChatPopup && (
        <ConfirmPopup
          message={
            <p className="text-xl font-semibold leading-relaxed text-gray-800">
              지금은 여기까지만 할까요?<br />언제든지 다시 시작할 수 있어요.
            </p>
          }
          confirmText="이어 말하기"
          cancelText="다음에 하기"
          onConfirm={handleContinueFromEnd}
          onCancel={handleStopFromEnd}
        />
      )}
    </>
  );
}
