"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MicButton, Button, MalangEE, MalangEEStatus } from "@/shared/ui";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { useRouter, useSearchParams } from "next/navigation";
import { useGeneralChat } from "@/features/chat";

/**
 * 대화 상태
 * ai-speaking: AI가 말하는 중
 * user-turn: 사용자 차례 (대기)
 * user-speaking: 사용자가 말하는 중
 */
type ConversationState = "ai-speaking" | "user-turn" | "user-speaking";

export default function ConversationPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // sessionId 상태 (초기값은 빈 문자열, 클라이언트에서 설정)
  const [sessionId, setSessionId] = useState<string>("");

  // sessionId 초기화 (우선순위: URL > localStorage > 새로 생성)
  useEffect(() => {
    // 1순위: URL 쿼리 파라미터에서 sessionId 읽기
    const urlSessionId = searchParams.get("sessionId");
    console.log("[SessionId] URL query value:", urlSessionId);

    if (urlSessionId) {
      console.log("[SessionId] Using URL sessionId:", urlSessionId);
      setSessionId(urlSessionId);
      // localStorage에도 동기화 (폴백용)
      localStorage.setItem("currentSessionId", urlSessionId);
      return;
    }

    // 2순위: localStorage에서 sessionId 읽기
    const savedSessionId = localStorage.getItem("currentSessionId");
    console.log("[SessionId] localStorage value:", savedSessionId);

    if (savedSessionId) {
      console.log("[SessionId] Using saved sessionId:", savedSessionId);
      setSessionId(savedSessionId);
      // URL에 sessionId 추가 (일관성 유지)
      router.replace(`/chat/conversation?sessionId=${savedSessionId}`, { scroll: false });
      return;
    }

    // 3순위: 새로 생성 (폴백)
    const newSessionId = crypto.randomUUID();
    console.log("[SessionId] Creating new sessionId:", newSessionId);
    localStorage.setItem("currentSessionId", newSessionId);
    setSessionId(newSessionId);
    // URL에 sessionId 추가
    router.replace(`/chat/conversation?sessionId=${newSessionId}`, { scroll: false });
  }, [searchParams, router]);

  // localStorage에서 설정 읽기
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);

  useEffect(() => {
    const subtitle = localStorage.getItem("subtitleEnabled");
    const voice = localStorage.getItem("selectedVoice");

    if (subtitle !== null) setSubtitleEnabled(subtitle === "true");
    if (voice !== null) setSelectedVoice(voice);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { state: chatState, connect, disconnect, sendAudioChunk, initAudio } = useGeneralChat({
    sessionId,
    voice: selectedVoice,
    showText: subtitleEnabled,
  });

  const [conversationState, setConversationState] = useState<ConversationState>("user-turn");
  const [showHint, setShowHint] = useState(false);
  const hintMessage = "Try saying: I'm doing great, thanks for asking!";
  const [textOpacity, setTextOpacity] = useState(1);

  // 마이크 녹음 관련
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMuted] = useState(false);

  // 팝업 상태
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [showWaitPopup, setShowWaitPopup] = useState(false);
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);

  // 타이머 ref
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket 연결 및 초기화 (sessionId가 설정된 후에만 연결)
  useEffect(() => {
    if (!sessionId) return; // sessionId가 없으면 연결하지 않음

    connect();
    return () => {
      disconnect();
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // sessionId가 설정되면 연결

  // 일반 대화는 사용자가 먼저 발화하므로 초기 메시지 전송 불필요

  // AI 말하기 상태 동기화
  useEffect(() => {
    if (chatState.isAiSpeaking) {
      setConversationState("ai-speaking");
    } else if (chatState.isConnected && chatState.isReady && !chatState.isAiSpeaking) {
      // AI가 말을 멈췄을 때, 사용자가 이미 말하고 있는 중이라면(녹음 중) 상태를 유지해야 함
      setConversationState((prev) => {
        if (prev === "user-speaking") return prev;
        return "user-turn";
      });
      startInactivityTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // 대기 팝업이 뜰 때 마이크 중단
      stopRecording();
      setConversationState("user-turn"); // 상태를 대기 상태로
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
    // 헬퍼: 다양한 브라우저 환경 호환성 확보
    const getMediaStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      // 1. 최신 표준 API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
      }
      // 2. 구형 API (Webkit, Moz 등)
      const legacyApi = (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia;
      if (legacyApi) {
        return new Promise((resolve, reject) => {
          legacyApi.call(navigator, constraints, resolve, reject);
        });
      }
      // 3. 지원 불가
      throw new Error("MEDIA_API_NOT_SUPPORTED");
    };

    try {
      const constraints = {
        audio: {
          sampleRate: { ideal: 16000 },
          channelCount: { ideal: 1 },
          echoCancellation: true,
          noiseSuppression: true,
        },
      };

      let stream: MediaStream;
      try {
        stream = await getMediaStream(constraints);
      } catch (err) {
        console.warn("[Recording] Preferred constraints failed. Trying basic fallback...", err);
        // 폴백: 가장 단순한 옵션으로 재시도
        stream = await getMediaStream({ audio: true });
      }

      streamRef.current = stream;

      // AudioContext 생성 (Safari/Old Browser 호환)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({
        sampleRate: 16000
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // [Debug] 마이크 입력 확인 (1초에 수십 번 찍히므로 샘플링하여 출력)
        // 약 20번에 1번 정도만 로그 출력
        if (Math.random() < 0.05) {
          let sum = 0;
          // 간단한 볼륨 체크
          for (let i = 0; i < inputData.length; i += 100) sum += Math.abs(inputData[i]);
          const avg = sum / (inputData.length / 100);
          if (avg > 0.01) { // 소리가 어느 정도 클 때만
            console.log("[Recording] Mic Input Level:", avg.toFixed(4));
          }
        }

        const float32Data = new Float32Array(inputData);
        sendAudioChunk(float32Data);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error("[Recording] Failed to start:", error);
      // 보안 정책(HTTPS) 등으로 인해 마이크를 쓸 수 없는 경우 사용자 안내
      if (error instanceof Error && (error.message === "MEDIA_API_NOT_SUPPORTED" || error.name === "NotAllowedError")) {
        alert("마이크를 사용할 수 없습니다.\nHTTPS 연결(또는 localhost)인지 확인하거나 마이크 권한을 허용해주세요.");
      }
      setConversationState("user-turn");
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
  }, []);

  const handleMicClick = () => {
    resetTimers();

    if (conversationState === "user-speaking") {
      // 말하기 종료 (수동 중단)
      stopRecording();
      setTextOpacity(0);
      setTimeout(() => {
        setConversationState("ai-speaking");
        setTextOpacity(1);
      }, 300);
    } else {
      // 말하기 시작 (대기 중이거나 AI 말하는 중일 때 - Barge-in 포함)
      setConversationState("user-speaking");
      setShowHint(false);
      startRecording();
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

  const getMalangEEStatus = (): MalangEEStatus => {
    if (showInactivityMessage) return "humm";
    if (conversationState === "ai-speaking") return "talking";
    return "default";
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
    setConversationState("user-turn"); // 다시 대화 가능한 상태로
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

  // 대화 종료하기 핸들러 (팝업 열기)
  const handleEndConversation = useCallback(() => {
    setShowEndChatPopup(true);
  }, []);

  // 대화 종료 확인
  const handleEndChatConfirm = useCallback(() => {
    setShowEndChatPopup(false);
    // WebSocket 연결 종료 (disconnect 메시지 전송)
    disconnect();
    // 마이크 녹음 중지
    stopRecording();
    // 대화 내역 페이지로 이동
    setTimeout(() => {
      router.push("/chat-history");
    }, 1000); // disconnect 메시지 전송 후 이동
  }, [disconnect, stopRecording, router]);

  // 대화 종료 취소
  const handleEndChatCancel = useCallback(() => {
    setShowEndChatPopup(false);
  }, []);

  // AI 메시지 표시 (chatState에서 가져옴)
  // 초기값이 필요 없다면 빈 문자열로 설정하거나, 상태에 따라 안내 문구를 보여줄 수 있음
  const displayMessage = chatState.aiMessage;

  // [Audio Autoplay Fix] 화면 클릭 시 AudioContext 초기화 (브라우저 정책 우회)
  useEffect(() => {
    const unlockAudio = () => {
      // 오디오 컨텍스트 Resume 시도
      // (useScenarioChat 내부 initAudio가 export 되어 있다고 가정)
      // *만약 useScenarioChat 수정이 아직 반영 안 됐다면 hook에서 initAudio를 반환하도록 수정 필요*
      // 확인: useScenarioChat.ts 수정 완료됨.
      if ((chatState as any).initAudio) {
        (chatState as any).initAudio();
      } else {
        // hook에서 initAudio를 직접 반환받아서 호출
        initAudio();
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, [initAudio, chatState]); // initAudio 의존성 추가

  // Layout에서 발생하는 "대화 종료하기" 클릭 이벤트 리스닝
  useEffect(() => {
    const handleEndConversationEvent = () => {
      handleEndConversation();
    };

    window.addEventListener("end-conversation", handleEndConversationEvent);

    return () => {
      window.removeEventListener("end-conversation", handleEndConversationEvent);
    };
  }, [handleEndConversation]);

  if (!isMounted) return null;

  return (
    <>
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
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${!chatState.isConnected
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
            !chatState.isConnected
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

      {/* 대화 종료 확인 팝업 */}
      {showEndChatPopup && (
        <PopupLayout onClose={handleEndChatCancel} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">대화를 종료하시겠어요?</div>
            <p className="text-center text-sm text-gray-600">
              현재까지의 대화 내용은 저장됩니다.
            </p>
            <div className="flex w-full gap-3">
              <Button variant="outline-purple" size="md" fullWidth onClick={handleEndChatCancel}>
                취소
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleEndChatConfirm}>
                종료하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
