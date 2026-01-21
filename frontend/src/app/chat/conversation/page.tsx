"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button, ChatMicButton, MalangEE, MalangEEStatus, ConfirmPopup, PopupLayout, SettingsPopup, SettingsTrigger } from "@/shared/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useConversationChatNew } from "@/features/chat/hook/useConversationChatNew";
import { useGetHints } from "@/features/chat/api/use-chat-sessions";
import { useAuth } from "@/features/auth";
import { debugLog, debugError } from "@/shared/lib";

const HINT_DELAY_MS = 15000; // 15초 후 힌트 프롬프트 표시
const WAIT_POPUP_DELAY_MS = 5000; // 힌트 표시 후 5초 더 대기하면 종료 모달

export default function ConversationPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: _user } = useAuth();

  // sessionId 상태
  const [sessionId, setSessionId] = useState<string>("");

  // 팝업 상태
  const [showSessionErrorPopup, setShowSessionErrorPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showWaitPopup, setShowWaitPopup] = useState(false);
  const [showLoginPopup, _setShowLoginPopup] = useState(false);

  // sessionId 초기화
  useEffect(() => {
    if (sessionId) return;

    const urlSessionId = searchParams.get("sessionId");
    const storedSessionId = localStorage.getItem("chatSessionId");

    if (urlSessionId) {
      debugLog("[SessionId] Using URL sessionId:", urlSessionId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionId(urlSessionId);
      localStorage.setItem("chatSessionId", urlSessionId);
    } else if (storedSessionId) {
      debugLog("[SessionId] Using stored sessionId:", storedSessionId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionId(storedSessionId);
      router.replace(`/chat/conversation?sessionId=${storedSessionId}`, { scroll: false });
    } else {
      debugError("[SessionId] No sessionId found");
      setShowSessionErrorPopup(true);
    }
  }, [sessionId, searchParams, router]);

  // 설정 상태
  const [selectedVoice, setSelectedVoice] = useState("shimmer");
  const [showSubtitle, setShowSubtitle] = useState(true);

  // 연결 성공 여부 추적 (ref 대신 state로 변경하여 렌더링 중 안전하게 접근)
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    const voice = localStorage.getItem("selectedVoice");
    const subtitle = localStorage.getItem("subtitleEnabled");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (voice !== null) setSelectedVoice(voice);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (subtitle !== null) setShowSubtitle(subtitle === "true");
  }, []);

  const {
    state,
    connect,
    disconnect,
    initAudio,
    requestResponse,
    startMicrophone,
    stopMicrophone,
    toggleMute: _toggleMute
  } = useConversationChatNew(sessionId, selectedVoice);

  const disconnectRef = useRef(disconnect);
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  useEffect(() => {
    if (state.isConnected && !wasConnected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWasConnected(true);
    }
  }, [state.isConnected, wasConnected]);

  // 힌트 관련 상태
  const [showHintPrompt, setShowHintPrompt] = useState(false);
  const [showHintText, setShowHintText] = useState(false);
  const [shouldFetchHint, setShouldFetchHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitPopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: _hints, isLoading: _isHintsLoading } = useGetHints(
    shouldFetchHint ? sessionId : null
  );

  // 마이크 상태
  const [isMuted, _setIsMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  // 타이머 정리 함수
  const clearHintTimer = useCallback(() => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
  }, []);

  const clearWaitPopupTimer = useCallback(() => {
    if (waitPopupTimerRef.current) {
      clearTimeout(waitPopupTimerRef.current);
      waitPopupTimerRef.current = null;
    }
  }, []);

  const resetHintState = useCallback(() => {
    clearHintTimer();
    clearWaitPopupTimer();
    setShowHintPrompt(false);
    setShowHintText(false);
    setShouldFetchHint(false);
    setShowWaitPopup(false);
  }, [clearHintTimer, clearWaitPopupTimer]);

  // 15초 타이머
  useEffect(() => {
    clearHintTimer();
    if (!state.lastAiAudioDoneAt || state.isAiSpeaking) return;
    if (state.isUserSpeaking) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetHintState();
      return;
    }

    const elapsedTime = Date.now() - state.lastAiAudioDoneAt;
    const remainingTime = Math.max(0, HINT_DELAY_MS - elapsedTime);

    hintTimerRef.current = setTimeout(() => {
      setShowHintPrompt(true);
    }, remainingTime);

    return clearHintTimer;
  }, [state.lastAiAudioDoneAt, state.isAiSpeaking, state.isUserSpeaking, clearHintTimer, resetHintState]);

  // 5초 추가 대기 후 종료 모달
  useEffect(() => {
    clearWaitPopupTimer();
    if (!showHintPrompt || state.isUserSpeaking) return;

    waitPopupTimerRef.current = setTimeout(() => {
      setShowWaitPopup(true);
    }, WAIT_POPUP_DELAY_MS);

    return clearWaitPopupTimer;
  }, [showHintPrompt, state.isUserSpeaking, clearWaitPopupTimer]);

  useEffect(() => {
    return () => {
      clearHintTimer();
      clearWaitPopupTimer();
    };
  }, [clearHintTimer, clearWaitPopupTimer]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // 자동 연결
  useEffect(() => {
    if (!isMounted || !sessionId || sessionId.trim() === "") return;

    initAudio();
    connect();

    return () => {
      disconnectRef.current();
    };
  }, [isMounted, sessionId, initAudio, connect]);

  // 마이크 시작
  useEffect(() => {
    if (!state.isConnected || !state.isReady || isMicEnabled) return;

    const startMic = async () => {
      try {
        setIsMicEnabled(true);
        await startMicrophone();
        setTimeout(() => requestResponse(), 500);
      } catch (error) {
        debugError("[StartMic] Failed:", error);
        setIsMicEnabled(false);
        alert("마이크를 시작할 수 없습니다.");
      }
    };

    startMic();
  }, [state.isConnected, state.isReady, isMicEnabled, startMicrophone, requestResponse]);

  // 마이크 상태 관리
  useEffect(() => {
    if (!state.isConnected || !state.isReady) {
      if (isMicEnabled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMicEnabled(false);
        stopMicrophone();
      }
    }
  }, [state.isConnected, state.isReady, isMicEnabled, stopMicrophone]);

  // 디버그 상태 전달
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("chat-debug-status", {
        detail: {
          isConnected: state.isConnected,
          isReady: state.isReady,
          lastEvent: null,
          isAiSpeaking: state.isAiSpeaking,
          isUserSpeaking: state.isUserSpeaking,
          isMuted,
          isRecording: isMicEnabled || state.isRecording,
          userTranscript: state.userTranscript,
        },
      })
    );
  }, [state.isConnected, state.isReady, state.isAiSpeaking, state.isUserSpeaking, state.isRecording, state.userTranscript, isMuted, isMicEnabled]);

  // 대화 종료 이벤트
  useEffect(() => {
    const handleConfirmEndConversation = async () => {
      await disconnect();
      router.push("/chat/complete");
    };

    window.addEventListener("confirm-end-conversation", handleConfirmEndConversation);
    return () => window.removeEventListener("confirm-end-conversation", handleConfirmEndConversation);
  }, [disconnect, router]);

  // MalangEE 상태
  const getMalangEEStatus = (): MalangEEStatus => {
    if (state.userTranscript?.toLowerCase().includes("[unintelligible]")) return "sad";
    if (showHintPrompt) return "humm";
    if (state.isAiSpeaking) return "talking";
    return "default";
  };

  // 메시지 상태
  const messageStates = [
    {
      condition: () => !state.isConnected && wasConnected,
      title: "연결에 문제가 있어요",
      desc: "잠시 후 다시 시도해주세요",
    },
    {
      condition: () => state.userTranscript?.toLowerCase().includes("[unintelligible]"),
      title: "말랭이가 이해하지 못했어요.",
      desc: "한번만 다시 말씀해 주세요.",
    },
    {
      condition: () => showHintPrompt && !state.isUserSpeaking && !state.isAiSpeaking,
      title: "말랭이가 대답을 기다리고 있어요.",
      desc: "Cheer up!",
    },
    {
      condition: () => state.isAiSpeaking,
      title: state.aiMessage || "말랭이가 말하고 있어요",
      desc: showSubtitle ? state.aiMessageKR || "" : "",
    },
    {
      condition: () => state.isConnected && state.isReady && !state.isAiSpeaking,
      title: state.aiMessage || "편하게 말해보세요",
      desc: showSubtitle && state.aiMessageKR ? state.aiMessageKR : "말랭이가 듣고 있어요",
    },
    {
      condition: () => !state.isConnected && !wasConnected,
      title: "말랭이와 연결하고 있어요",
      desc: "잠시만 기다려주세요",
    },
    {
      condition: () => true,
      title: "잠시만 기다려주세요",
      desc: "",
    },
  ];

  const getCurrentMessage = () => messageStates.find(s => s.condition()) || messageStates[messageStates.length - 1];
  const getMainTitle = () => getCurrentMessage().title;
  const getSubDesc = () => getCurrentMessage().desc;

  // 핸들러
  const _handleHintClick = useCallback(() => {
    if (showHintText) {
      setShowHintText(false);
      return;
    }
    setShouldFetchHint(true);
    setShowHintText(true);
  }, [showHintText]);

  const handleStopFromWait = async () => {
    setShowWaitPopup(false);
    await disconnect();
    router.push("/chat/complete");
  };

  const handleContinueChat = () => {
    resetHintState();
  };

  const handleSubtitleChange = (enabled: boolean) => {
    setShowSubtitle(enabled);
    localStorage.setItem("subtitleEnabled", enabled.toString());
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    localStorage.setItem("selectedVoice", voiceId);
  };

  return (
    <>
      {/* Character */}
      <div className="character-box relative">
        <MalangEE status={getMalangEEStatus()} size={150} />
      </div>

      {/* 메시지 및 마이크 */}
      <div className="flex w-full flex-col items-center transition-all duration-300">
        <div className="relative flex min-h-[120px] w-full flex-col items-center justify-center">
          <div className="text-group text-center">
            <h1 className="scenario-title whitespace-pre-line">{getMainTitle()}</h1>
            <p className="scenario-desc">{getSubDesc()}</p>
          </div>
        </div>

        <ChatMicButton
          state={state}
          isMuted={isMuted}
          isListening={isMicEnabled || state.isRecording}
          hasStarted={true}
        />
      </div>

      {/* 설정 변경하기 버튼 */}
      <div className="mt-6">
        <SettingsTrigger onClick={() => setShowSettingsPopup(true)} />
      </div>

      {/* 설정 팝업 */}
      <SettingsPopup
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
        showSubtitle={showSubtitle}
        onSubtitleChange={handleSubtitleChange}
        selectedVoice={selectedVoice}
        onVoiceChange={handleVoiceChange}
      />

      {/* Login Popup */}
      {showLoginPopup && (
        <ConfirmPopup
          message={
            <p className="text-xl font-semibold leading-relaxed text-gray-800">
              로그인을 하면 대화를 저장하고<br />이어 말할 수 있어요
            </p>
          }
          confirmText="로그인하기"
          cancelText="회원가입"
          onConfirm={() => router.push("/auth/login")}
          onCancel={() => router.push("/auth/signup")}
        />
      )}

      {/* Wait Popup - 대화 그만하기 → /chat/complete */}
      {showWaitPopup && (
        <ConfirmPopup
          message={
            <p className="text-xl font-semibold leading-relaxed text-gray-800">
              대화가 잠시 멈췄어요.<br />계속 이야기 할까요?
            </p>
          }
          confirmText="이어 말하기"
          cancelText="대화 그만하기"
          onConfirm={handleContinueChat}
          onCancel={handleStopFromWait}
        />
      )}

      {/* SessionId 에러 팝업 */}
      {showSessionErrorPopup && (
        <PopupLayout onClose={() => {}} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">세션을 찾을 수 없어요</div>
            <p className="text-center text-sm text-gray-600">주제를 먼저 선택해주세요</p>
            <div className="flex w-full gap-3">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => router.push("/chat/scenario-select")}
              >
                주제 선택하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
