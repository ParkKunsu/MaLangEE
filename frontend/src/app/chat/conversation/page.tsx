"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MicButton, Button, MalangEE, MalangEEStatus } from "@/shared/ui";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import { FullLayout } from "@/shared/ui/FullLayout";
import { useRouter } from "next/navigation";
import { useScenarioChat } from "@/features/chat";

/**
 * 대화 상태
 * ai-speaking: AI가 말하는 중
 * user-turn: 사용자 차례 (대기)
 * user-speaking: 사용자가 말하는 중
 */
type ConversationState = "ai-speaking" | "user-turn" | "user-speaking";

export default function ConversationPage() {
  const router = useRouter();
  const { state: chatState, connect, disconnect, sendText, sendAudioChunk } = useScenarioChat();

  const [conversationState, setConversationState] = useState<ConversationState>("ai-speaking");
  const [showHint, setShowHint] = useState(false);
  const hintMessage = "Try saying: I'm doing great, thanks for asking!";
  const [textOpacity, setTextOpacity] = useState(1);

  // 마이크 녹음 관련
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 세션 스토리지에서 자막 설정 가져오기
  const getInitialSubtitleSetting = () => {
    if (typeof window === "undefined") return true;
    const subtitle = sessionStorage.getItem("subtitleEnabled");
    return subtitle === null ? true : subtitle === "true";
  };

  const [subtitleEnabled, setSubtitleEnabled] = useState(getInitialSubtitleSetting);
  const [isMuted, setIsMuted] = useState(false);

  // 팝업 상태
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [showWaitPopup, setShowWaitPopup] = useState(false);
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);

  // 타이머 ref
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket 연결 및 초기화
  useEffect(() => {
    connect();
    return () => {
      disconnect();
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebSocket 상태에 따른 대화 상태 업데이트
  useEffect(() => {
    if (chatState.isReady && conversationState === "ai-speaking") {
      // AI가 준비되면 초기 메시지 전송
      sendText("Hello! Start a conversation with me.");
    }
  }, [chatState.isReady]);

  // AI 말하기 상태 동기화
  useEffect(() => {
    if (chatState.isAiSpeaking) {
      setConversationState("ai-speaking");
    } else if (chatState.isConnected && chatState.isReady && !chatState.isAiSpeaking) {
      setConversationState("user-turn");
      startInactivityTimer();
    }
  }, [chatState.isAiSpeaking, chatState.isConnected, chatState.isReady]);

  // 비활동 타이머 시작 (15초 후 메시지 표시)
  const startInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityMessage(true);
      setConversationState("user-turn");
      startWaitTimer();
    }, 15000);
  };

  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const startWaitTimer = () => {
    clearWaitTimer();
    waitTimerRef.current = setTimeout(() => {
      setShowWaitPopup(true);
    }, 5000);
  };

  const clearWaitTimer = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };

  const resetTimers = () => {
    clearInactivityTimer();
    clearWaitTimer();
    setShowInactivityMessage(false);
  };

  // 마이크 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const float32Data = new Float32Array(inputData);
        sendAudioChunk(float32Data, 16000);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      console.log("[Recording] Started");
    } catch (error) {
      console.error("[Recording] Failed to start:", error);
    }
  }, [sendAudioChunk]);

  // 마이크 녹음 중지
  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    console.log("[Recording] Stopped");
  }, []);

  const handleMicClick = () => {
    if (conversationState === "ai-speaking") return;

    resetTimers();

    if (conversationState === "user-turn") {
      // 사용자가 말하기 시작
      setConversationState("user-speaking");
      setShowHint(false);
      startRecording();
    } else if (conversationState === "user-speaking") {
      // 사용자가 말하기 완료 -> AI 차례
      stopRecording();
      setTextOpacity(0);

      setTimeout(() => {
        setConversationState("ai-speaking");
        setTextOpacity(1);
      }, 300);
    }
  };

  const handleHintClick = () => {
    if (conversationState === "user-turn") {
      setShowHint(!showHint);
    }
  };

  const getStatusText = () => {
    if (!chatState.isConnected) {
      return "연결 중...";
    }
    if (chatState.error) {
      return `오류: ${chatState.error}`;
    }
    if (showInactivityMessage) {
      return "말랭이가 대답을 기다리고 있어요. Cheer up!";
    }

    switch (conversationState) {
      case "ai-speaking":
        return "말랭이가 말하는 중...";
      case "user-turn":
        return "당신의 차례예요";
      case "user-speaking":
        return "듣는 중...";
      default:
        return "";
    }
  };

  const toggleSubtitle = () => {
    setSubtitleEnabled(!subtitleEnabled);
    sessionStorage.setItem("subtitleEnabled", (!subtitleEnabled).toString());
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getMalangEEStatus = (): MalangEEStatus => {
    if (showInactivityMessage) return "humm";
    if (conversationState === "ai-speaking") return "talking";
    return "default";
  };

  const handleCompleteChat = () => {
    sessionStorage.setItem("totalChatDuration", "240");
    sessionStorage.setItem("userSpeakDuration", "150");
    router.push("/chat/complete");
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleStopChat = () => {
    router.push("/auth/signup");
  };

  const handleContinueChat = () => {
    setShowWaitPopup(false);
    resetTimers();
    startInactivityTimer();
  };

  const handleStopFromWait = () => {
    router.push("/auth/signup");
  };

  const handleContinueFromEnd = () => {
    setShowEndChatPopup(false);
    resetTimers();
    startInactivityTimer();
  };

  const handleStopFromEnd = () => {
    router.push("/auth/signup");
  };

  // AI 메시지 표시 (chatState에서 가져옴)
  const displayMessage = chatState.aiMessage || "Hello! How are you today?";

  return (
    <>
      <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
        {/* Connection Status */}
        {!chatState.isConnected && (
          <div className="mb-4 rounded-lg bg-yellow-100 px-4 py-2 text-center text-yellow-700">
            WebSocket 연결 중...
          </div>
        )}
        {chatState.error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-center text-red-700">
            {chatState.error}
          </div>
        )}

        {/* Character */}
        <div className="character-box relative">
          <MalangEE status={getMalangEEStatus()} size={150} />

          {/* Hint Bubble */}
          {conversationState === "user-turn" && (
            <div className="absolute -bottom-[55px] left-1/2 z-10 -translate-x-1/2">
              <button
                onClick={handleHintClick}
                className="relative rounded-2xl border-2 border-yellow-300 bg-yellow-50 px-6 py-3 shadow-lg transition-all hover:bg-yellow-100"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="h-0 w-0 border-b-[12px] border-l-[12px] border-r-[12px] border-b-yellow-300 border-l-transparent border-r-transparent"></div>
                  <div className="absolute left-1/2 top-[2px] h-0 w-0 -translate-x-1/2 border-b-[10px] border-l-[10px] border-r-[10px] border-b-yellow-50 border-l-transparent border-r-transparent"></div>
                </div>

                {showHint ? (
                  <p className="whitespace-nowrap text-sm text-gray-700">{hintMessage}</p>
                ) : (
                  <p className="whitespace-nowrap text-sm italic text-gray-500">
                    Lost your words? <br /> (tap for a hint)
                  </p>
                )}
              </button>
            </div>
          )}
        </div>

        {/* AI Message Display */}
        {subtitleEnabled && (
          <div className="text-group mt-4 text-center" style={{ opacity: textOpacity }}>
            <h1 className="scenario-title">{displayMessage}</h1>
          </div>
        )}

        {/* User Transcript */}
        {chatState.userTranscript && (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">You said: {chatState.userTranscript}</p>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mb-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${
              !chatState.isConnected
                ? "bg-yellow-100 text-yellow-700"
                : conversationState === "ai-speaking"
                  ? "bg-blue-100 text-blue-700"
                  : conversationState === "user-speaking"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
            }`}
          >
            {conversationState === "ai-speaking" && chatState.isConnected && (
              <div className="flex gap-1">
                <span className="h-4 w-1 animate-pulse bg-blue-500"></span>
                <span
                  className="h-4 w-1 animate-pulse bg-blue-500"
                  style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                  className="h-4 w-1 animate-pulse bg-blue-500"
                  style={{ animationDelay: "0.4s" }}
                ></span>
              </div>
            )}
            <p className="scenario-desc">{getStatusText()}</p>
          </div>
        </div>

        {/* Mic Button */}
        <div className="relative mt-2">
          <MicButton
            isListening={conversationState === "user-speaking"}
            onClick={handleMicClick}
            size="md"
            className={
              conversationState === "ai-speaking" || !chatState.isConnected
                ? "pointer-events-none opacity-50"
                : ""
            }
            isMuted={isMuted}
          />
        </div>

        {/* AI Speaking Wave Animation */}
        {conversationState === "ai-speaking" && chatState.isConnected && (
          <div className="absolute left-1/2 top-full mt-2 flex -translate-x-1/2 justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-primary-600 animate-wave w-1 rounded-full"
                style={{
                  height: "20px",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Debug Controls */}
        <div className="mt-8 flex flex-col items-center gap-2 border-t pt-4">
          <p className="mb-1 text-xs font-bold text-gray-600">디버그 컨트롤</p>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => connect()}
              className="rounded-full bg-green-100 px-3 py-1 text-xs transition hover:bg-green-200"
            >
              WebSocket 재연결
            </button>
            <button
              onClick={() => sendText("Hello, how are you?")}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs transition hover:bg-blue-200"
              disabled={!chatState.isConnected}
            >
              테스트 메시지 전송
            </button>
            <button
              onClick={toggleSubtitle}
              className={`rounded-full px-3 py-1 text-xs transition ${
                subtitleEnabled
                  ? "bg-purple-100 hover:bg-purple-200"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {subtitleEnabled ? "자막 숨기기" : "자막 보기"}
            </button>
            <button
              onClick={toggleMute}
              className={`rounded-full px-3 py-1 text-xs transition ${
                isMuted ? "bg-red-100 hover:bg-red-200" : "bg-blue-100 hover:bg-blue-200"
              }`}
            >
              {isMuted ? "음소거 해제" : "음소거"}
            </button>
          </div>

          <p className="mb-1 mt-2 text-xs font-bold text-gray-600">팝업 테스트</p>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setShowLoginPopup(true)}
              className="rounded-full bg-purple-100 px-3 py-1 text-xs transition hover:bg-purple-200"
            >
              로그인 권유 팝업
            </button>
            <button
              onClick={() => setShowWaitPopup(true)}
              className="rounded-full bg-cyan-100 px-3 py-1 text-xs transition hover:bg-cyan-200"
            >
              응답 대기 팝업
            </button>
            <button
              onClick={() => setShowEndChatPopup(true)}
              className="rounded-full bg-pink-100 px-3 py-1 text-xs transition hover:bg-pink-200"
            >
              대화 종료 팝업
            </button>
            <button
              onClick={handleCompleteChat}
              className="rounded-full bg-green-100 px-3 py-1 text-xs transition hover:bg-green-200"
            >
              대화 완료
            </button>
          </div>

          {/* Connection Info */}
          <div className="mt-2 text-xs text-gray-500">
            <p>Connected: {chatState.isConnected ? "✅" : "❌"}</p>
            <p>Ready: {chatState.isReady ? "✅" : "❌"}</p>
          </div>
        </div>
      </FullLayout>

      {/* Login Popup */}
      {showLoginPopup && (
        <PopupLayout onClose={() => setShowLoginPopup(false)} maxWidth="md" showCloseButton={false}>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
              <p className="text-xl font-semibold leading-relaxed text-gray-800">
                로그인을 하면 대화를 저장하고
                <br />
                이어 말할 수 있어요
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button
                onClick={handleStopChat}
                variant="outline"
                className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                대화 그만하기
              </Button>
              <Button variant="primary" size="xl" onClick={handleLogin} className="flex-1">
                로그인하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}

      {/* Wait Popup */}
      {showWaitPopup && (
        <PopupLayout onClose={() => setShowWaitPopup(false)} maxWidth="md" showCloseButton={false}>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
              <p className="text-xl font-semibold leading-relaxed text-gray-800">
                대화가 잠시 멈췄어요.
                <br />
                계속 이야기 할까요?
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button
                onClick={handleStopFromWait}
                variant="outline"
                className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                대화 그만하기
              </Button>
              <Button variant="primary" size="xl" onClick={handleContinueChat} className="flex-1">
                이어 말하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}

      {/* End Chat Popup */}
      {showEndChatPopup && (
        <PopupLayout
          onClose={() => setShowEndChatPopup(false)}
          maxWidth="md"
          showCloseButton={false}
        >
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
              <p className="text-xl font-semibold leading-relaxed text-gray-800">
                지금은 여기까지만 할까요?
                <br />
                나중에 같은 주제로 다시 대화할 수 있어요.
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button
                onClick={handleStopFromEnd}
                variant="outline"
                className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                대화 그만하기
              </Button>
              <Button variant="primary" size="xl" onClick={handleContinueFromEnd} className="flex-1">
                이어 말하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
