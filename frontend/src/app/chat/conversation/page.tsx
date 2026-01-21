"use client";

import { useEffect, useState, useRef } from "react";
import { Button, ChatMicButton, MalangEE, MalangEEStatus, ConfirmPopup, PopupLayout } from "@/shared/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useConversationChatNew } from "@/features/chat/hook/useConversationChatNew";
import { Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/features/auth";
import { debugLog, debugError } from "@/shared/lib";

export default function ConversationPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userName = user?.nickname || "나";

  // sessionId 상태 (초기값은 빈 문자열, 클라이언트에서 설정)
  const [sessionId, setSessionId] = useState<string>("");

  // 팝업 상태 (useEffect에서 사용하므로 상단에 선언)
  const [showSessionErrorPopup, setShowSessionErrorPopup] = useState(false);

  // sessionId 초기화 (우선순위: URL > localStorage)
  useEffect(() => {
    // 이미 sessionId가 설정되어 있으면 무시 (무한 루프 방지)
    if (sessionId) return;

    const urlSessionId = searchParams.get("sessionId");
    const storedSessionId = localStorage.getItem("chatSessionId");

    if (urlSessionId) {
      // 1순위: URL에 sessionId가 있으면 사용
      debugLog("[SessionId] Using URL sessionId:", urlSessionId);
      setSessionId(urlSessionId);
      localStorage.setItem("chatSessionId", urlSessionId);
    } else if (storedSessionId) {
      // 2순위: localStorage에 있으면 URL에 추가
      debugLog("[SessionId] Using stored sessionId:", storedSessionId);
      setSessionId(storedSessionId);
      router.replace(`/chat/conversation?sessionId=${storedSessionId}`, { scroll: false });
    } else {
      // sessionId가 없으면 에러 팝업 표시
      debugError("[SessionId] No sessionId found");
      setShowSessionErrorPopup(true);
    }
  }, [sessionId, searchParams, router]);

  // TODO: localStorage에서 설정 읽기 -> api에서 읽는 것으로 변경해야 할듯.
  const [selectedVoice, setSelectedVoice] = useState("shimmer"); //목소리
  const [showSubtitle, setShowSubtitle] = useState(true); //자막 표시 상태

  // 연결 성공 여부 추적 (연결 중 vs 에러 구분용)
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    const voice = localStorage.getItem("selectedVoice");
    const subtitle = localStorage.getItem("subtitleEnabled");

    if (voice !== null) setSelectedVoice(voice);
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
    toggleMute
  } = useConversationChatNew(sessionId, selectedVoice);

  // disconnect 함수를 ref로 관리 (useEffect 의존성 문제 방지)
  const disconnectRef = useRef(disconnect);

  // disconnect ref 업데이트
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  // 연결 상태 추적
  useEffect(() => {
    if (state.isConnected) {
      wasConnectedRef.current = true;
    }
  }, [state.isConnected]);

  const [showHint, setShowHint] = useState(false);
  const hintMessage = "Try saying: I'm doing great, thanks for asking!";
  const [textOpacity, setTextOpacity] = useState(1);

  // 마이크 녹음 관련
  const [isMuted, setIsMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false); // 마이크 ON 상태 추적

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {};
  }, []);

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);


  // 페이지 로드 시 자동 연결
  useEffect(() => {
    debugLog("[Auto-Connect] useEffect triggered - isMounted:", isMounted, "sessionId:", sessionId);

    if (!isMounted || !sessionId || sessionId.trim() === "") {
      debugLog("[Auto-Connect] Skipping - not ready:", { isMounted, sessionId });
      return;
    }

    debugLog("[Auto-Connect] Starting connection sequence for session:", sessionId);

    // 오디오 초기화 및 연결
    initAudio();
    debugLog("[Auto-Connect] initAudio() called");

    connect();
    debugLog("[Auto-Connect] connect() called");

    // 언마운트 시 정리 (ref 사용으로 의존성 배열에서 disconnect 제거)
    return () => {
      debugLog("[Auto-Connect] Cleaning up connection");
      disconnectRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, sessionId, initAudio, connect]);

  // 연결 완료 후 마이크 시작 + AI에게 첫 인사 요청
  useEffect(() => {
    debugLog("[Connection Ready] useEffect triggered");
    debugLog("[Connection Ready] state.isConnected:", state.isConnected);
    debugLog("[Connection Ready] state.isReady:", state.isReady);
    debugLog("[Connection Ready] isMicEnabled:", isMicEnabled);

    if (!state.isConnected || !state.isReady) {
      debugLog("[Connection Ready] Waiting for connection...");
      return;
    }

    if (isMicEnabled) {
      debugLog("[Connection Ready] Microphone already enabled, skipping");
      return;
    }

    debugLog("[Connection Ready] ✅ All conditions met! Starting microphone...");
    debugLog("[Connection Ready] state.isRecording:", state.isRecording);

    // 마이크 시작 (비동기 처리 + 에러 핸들링)
    const startMic = async () => {
      try {
        setIsMicEnabled(true); // 즉시 웨이브 표시
        debugLog("[StartMic] setIsMicEnabled(true) called");

        await startMicrophone(); // 실제 마이크 시작 (비동기 대기)
        debugLog("[StartMic] Microphone started successfully");
        debugLog("[StartMic] state.isRecording after start:", state.isRecording);

        // 마이크 시작 후 AI 응답 요청
        setTimeout(() => {
          requestResponse();
        }, 500);
      } catch (error) {
        debugError("[StartMic] Failed to start microphone:", error);
        setIsMicEnabled(false); // 에러 발생 시 상태 되돌림
        alert("마이크를 시작할 수 없습니다. 브라우저 설정에서 마이크 권한을 확인해주세요.");
      }
    };

    startMic();
  }, [state.isConnected, state.isReady, isMicEnabled, startMicrophone, requestResponse]);

  // state.isRecording 변화 추적 (디버깅용)
  useEffect(() => {
    debugLog("[Debug] state.isRecording changed:", state.isRecording);
    debugLog("[Debug] isMicEnabled:", isMicEnabled);
    debugLog("[Debug] state.isConnected:", state.isConnected);
    debugLog("[Debug] state.isReady:", state.isReady);
  }, [state.isRecording, isMicEnabled, state.isConnected, state.isReady]);

  // 마이크 상태 자동 관리 (연결 끊김 시에만 중지)
  useEffect(() => {
    // 연결 안 됨 또는 준비 안 됨 → 마이크 중지
    if (!state.isConnected || !state.isReady) {
      if (isMicEnabled) {
        debugLog("[Mic Control] Stopping microphone - connection lost");
        setIsMicEnabled(false);
        stopMicrophone();
      }
      return;
    }
    // AI 발화 중에도 마이크는 계속 ON 유지 (음소거 기능으로 제어)
  }, [state.isConnected, state.isReady, isMicEnabled, stopMicrophone]);

  // Layout의 DebugStatus에 상태 전달 (CustomEvent)
  useEffect(() => {
    const debugStatus = {
      isConnected: state.isConnected,
      isReady: state.isReady,
      lastEvent: null,
      isAiSpeaking: state.isAiSpeaking,
      isUserSpeaking: state.isUserSpeaking,
      isMuted: isMuted,
      isRecording: isMicEnabled || state.isRecording, // 로컬 상태 또는 실제 녹음 상태
      userTranscript: state.userTranscript,
    };

    window.dispatchEvent(
      new CustomEvent("chat-debug-status", {
        detail: debugStatus,
      })
    );
  }, [
    state.isConnected,
    state.isReady,
    state.isAiSpeaking,
    state.isUserSpeaking,
    state.isRecording,
    state.userTranscript,
    isMuted,
    isMicEnabled,
  ]);

  // confirm-end-conversation 이벤트 리스닝 (Layout에서 발생)
  useEffect(() => {
    const handleConfirmEndConversation = async () => {
      debugLog("[Event] confirm-end-conversation received");
      const report = await disconnect();
      debugLog("[Disconnect] Complete, report:", report);
      router.push("/dashboard");
    };

    window.addEventListener("confirm-end-conversation", handleConfirmEndConversation);
    return () => {
      window.removeEventListener("confirm-end-conversation", handleConfirmEndConversation);
    };
  }, [disconnect, router]);

  // 팝업 상태
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [showWaitPopup, setShowWaitPopup] = useState(false);

  const getMalangEEStatus = (): MalangEEStatus => {
    if (showInactivityMessage) return "humm";
    if (state.isAiSpeaking) return "talking";
    // AI가 말하지 않을 때는 humm 상태
    return "humm";
  };

  // 자막 토글 함수
  const toggleSubtitle = () => {
    const newValue = !showSubtitle;
    setShowSubtitle(newValue);
    localStorage.setItem("subtitleEnabled", newValue.toString());
  };

  // 상황별 메시지 정의 (우선순위 순서)
  const messageStates = [
    {
      // 1. 연결 끊김 에러 (한 번이라도 연결됐다가 끊긴 경우)
      condition: () => !state.isConnected && wasConnectedRef.current,
      title: "연결에 문제가 있어요",
      desc: "잠시 후 다시 시도해주세요",
    },
    {
      // 2. 비활성 상태 (사용자 응답 없음)
      condition: () => showInactivityMessage,
      title: "말랭이가 대답을 기다리고 있어요",
      desc: "Cheer up!",
    },
    {
      // 3. AI 발화 중 - title에 AI 영어 메시지, desc에 자막 또는 기본 메시지
      condition: () => state.isAiSpeaking,
      title: state.aiMessage || "말랭이가 말하고 있어요",
      desc: showSubtitle ? state.aiMessageKR || "잘 들어보세요" : "말랭이가 말하고 있어요",
    },
    {
      // 4. 사용자 발화 중 (AI 발화가 끝나면 자동으로 이 상태로 전환)
      condition: () => state.isConnected && state.isReady && !state.isAiSpeaking,
      title: "편하게 말해보세요",
      desc: "말랭이가 듣고 있어요",
    },
    {
      // 5. 연결 중 (아직 연결된 적 없음)
      condition: () => !state.isConnected && !wasConnectedRef.current,
      title: "말랭이와 연결하고 있어요",
      desc: "잠시만 기다려주세요",
    },
    {
      // 6. 기본값
      condition: () => true,
      title: "잠시만 기다려주세요",
      desc: "",
    },
  ];

  const getCurrentMessage = () => {
    return messageStates.find(state => state.condition()) || messageStates[messageStates.length - 1];
  };

  const getMainTitle = () => getCurrentMessage().title;
  const getSubDesc = () => getCurrentMessage().desc;

  const handleHintClick = () => {
    setShowHint(!showHint);
  };

  // 음소거 토글 핸들러
  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    toggleMute(newMuteState);
    debugLog(`[Mute Toggle] ${newMuteState ? 'Muted' : 'Unmuted'}`);
  };

  const handleStopFromWait = () => {
    disconnect();
    router.push("/dashboard");
  };

  const handleContinueChat = () => {
    setShowWaitPopup(false);
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleSignup = () => {
    router.push("/auth/signup");
  };

  return (
    <>
      {/* Character */}
      <div className="character-box relative">
        <MalangEE status={getMalangEEStatus()} size={150} />

        {/* Hint Bubble */}

        <div className="animate-in fade-in slide-in-from-left-4 absolute -right-[220px] top-1/2 z-10 -translate-y-1/2 duration-500">
          <button
            onClick={handleHintClick}
            className="relative max-w-[200px] rounded-2xl border-2 border-yellow-300 bg-yellow-50 px-6 py-3 shadow-lg transition-all hover:bg-yellow-100"
          >
            {/* Arrow pointing to character (left) */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2">
              <div className="h-0 w-0 border-b-[12px] border-r-[12px] border-t-[12px] border-b-transparent border-r-yellow-300 border-t-transparent"></div>
              <div className="absolute left-[2px] top-1/2 h-0 w-0 -translate-y-1/2 border-b-[10px] border-r-[10px] border-t-[10px] border-b-transparent border-r-yellow-50 border-t-transparent"></div>
            </div>

            {showHint ? (
              <p className="text-sm leading-tight text-gray-700">{hintMessage}</p>
            ) : (
              <p className="text-sm italic leading-tight text-gray-500">
                Lost your words? <br /> (tap for a hint)
              </p>
            )}
          </button>
        </div>
      </div>

      {/* Area 1: 안내 메시지 및 마이크 (상단) */}
      <div className="flex w-full flex-col items-center transition-all duration-300">
        <div className="relative flex min-h-[120px] w-full flex-col items-center justify-center">
          {/* 텍스트 영역 (상황별 안내 메시지) */}
          <div className="text-group text-center" style={{ opacity: textOpacity }}>
            <h1 className="scenario-title whitespace-pre-line">{getMainTitle()}</h1>
            <p className="scenario-desc">{getSubDesc()}</p>
          </div>
        </div>

        {/* Mic Button */}
        <ChatMicButton
          state={state}
          isMuted={isMuted}
          isListening={isMicEnabled || state.isRecording}
          hasStarted={true}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        {/* 음소거 토글 버튼 */}
        <button
          onClick={handleMuteToggle}
          className="text-text-secondary hover:text-brand flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!state.isConnected || !state.isRecording}
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
          onConfirm={handleLogin}
          onCancel={handleSignup}
        />
      )}

      {/* Wait Popup */}
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
