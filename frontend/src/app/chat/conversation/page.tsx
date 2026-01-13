"use client";

import { useState, useEffect, useRef } from "react";
import { MicButton, Button, MalangEE, MalangEEStatus } from "@/shared/ui";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import { FullLayout } from "@/shared/ui/FullLayout";
import { useRouter } from "next/navigation";

/**
 * 대화 상태
 * ai-speaking: AI가 말하는 중
 * user-turn: 사용자 차례 (대기)
 * user-speaking: 사용자가 말하는 중
 */
type ConversationState = "ai-speaking" | "user-turn" | "user-speaking";

export default function ConversationPage() {
  const router = useRouter();
  const [conversationState, setConversationState] = useState<ConversationState>("ai-speaking");
  const [aiMessage, setAiMessage] = useState("Hello! How are you today?");
  const [showHint, setShowHint] = useState(false);
  const hintMessage = "Try saying: I'm doing great, thanks for asking!";
  const [textOpacity, setTextOpacity] = useState(1);

  // 세션 스토리지에서 자막 설정 가져오기 (초기값으로)
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

  // 비활동 타이머 시작 (15초 후 메시지 표시)
  const startInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityMessage(true);
      setConversationState("user-turn");
      // 비활동 메시지 표시 후 5초 뒤 응답 대기 팝업
      startWaitTimer();
    }, 15000);
  };

  // 비활동 타이머 정리
  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  // 응답 대기 타이머 시작 (5초 후 팝업 표시)
  const startWaitTimer = () => {
    clearWaitTimer();
    waitTimerRef.current = setTimeout(() => {
      setShowWaitPopup(true);
    }, 5000);
  };

  // 응답 대기 타이머 정리
  const clearWaitTimer = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };

  // 사용자 활동 시작 (타이머 초기화)
  const resetTimers = () => {
    clearInactivityTimer();
    clearWaitTimer();
    setShowInactivityMessage(false);
  };

  useEffect(() => {
    // 시뮬레이션: AI가 먼저 말을 건 후 사용자 차례로 전환
    const timer = setTimeout(() => {
      setConversationState("user-turn");
      startInactivityTimer(); // 사용자 차례가 되면 비활동 타이머 시작
    }, 3000); // 3초 후 사용자 차례

    return () => {
      clearTimeout(timer);
      clearInactivityTimer();
      clearWaitTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMicClick = () => {
    if (conversationState === "ai-speaking") return;

    // 사용자 활동 - 타이머 리셋
    resetTimers();

    if (conversationState === "user-turn") {
      // 사용자가 말하기 시작
      setConversationState("user-speaking");
      setShowHint(false);
    } else if (conversationState === "user-speaking") {
      // 사용자가 말하기 완료 -> AI 차례
      setTextOpacity(0);

      setTimeout(() => {
        setConversationState("ai-speaking");
        // 시뮬레이션: AI 응답
        const responses = [
          "That's wonderful to hear! What brings you here today?",
          "Great! Tell me more about yourself.",
          "Nice! How can I help you practice English?",
        ];
        setAiMessage(responses[Math.floor(Math.random() * responses.length)]);
        setTextOpacity(1);

        // AI 응답 후 다시 사용자 차례
        setTimeout(() => {
          setConversationState("user-turn");
          startInactivityTimer(); // 사용자 차례가 되면 비활동 타이머 시작
        }, 4000);
      }, 300);
    }
  };

  const handleHintClick = () => {
    if (conversationState === "user-turn") {
      setShowHint(!showHint);
    }
  };

  const getStatusText = () => {
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
    // 대화 시간 시뮬레이션 데이터 저장
    sessionStorage.setItem("totalChatDuration", "240"); // 4분
    sessionStorage.setItem("userSpeakDuration", "150"); // 2분 30초
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

  return (
    <>
    <FullLayout showHeader={true} maxWidth="md:max-w-[60vw]">
      {/* Character */}
      <div className="character-box relative">
        <MalangEE status={getMalangEEStatus()} size={150} />

        {/* Hint Bubble (사용자 차례일 때만 표시 - 캐릭터 아래에 위치) */}
        {conversationState === "user-turn" && (
          <div className="absolute -bottom-[55px] left-1/2 z-10 -translate-x-1/2">
            <button
              onClick={handleHintClick}
              className="relative rounded-2xl border-2 border-yellow-300 bg-yellow-50 px-6 py-3 shadow-lg transition-all hover:bg-yellow-100"
            >
              {/* 말풍선 꼬리 (위쪽을 향함) */}
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

      {/* AI Message Display (자막 활성화 시에만) */}
      {subtitleEnabled && (
        <div className="text-group mt-4 text-center" style={{ opacity: textOpacity }}>
          <h1 className="scenario-title">{aiMessage}</h1>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mb-3">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${
            conversationState === "ai-speaking"
              ? "bg-blue-100 text-blue-700"
              : conversationState === "user-speaking"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {conversationState === "ai-speaking" && (
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
          <p className="scenario-desc">{getStatusText()} </p>
        </div>
      </div>

      {/* Mic Button */}
      <div className="mt-2 relative">
        <MicButton
          isListening={conversationState === "user-speaking"}
          onClick={handleMicClick}
          size="md"
          className={conversationState === "ai-speaking" ? "pointer-events-none opacity-50" : ""}
          isMuted={isMuted}
        />
      </div>

      {/* AI Speaking Indicator - Wave Animation */}
      {conversationState === "ai-speaking" && (
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

      {/* 임시 테스트 링크들 */}
      <div className="mt-8 flex flex-col items-center gap-2 border-t pt-4">
        <p className="mb-1 text-xs font-bold text-gray-600">대화 상태 테스트용 링크</p>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              setConversationState("ai-speaking");
              setShowHint(false);
              setTextOpacity(1);
              setAiMessage("Hello! How are you today?");
              setShowInactivityMessage(false);
              resetTimers();
            }}
            className="rounded-full bg-indigo-100 px-3 py-1 text-xs transition hover:bg-indigo-200"
          >
            초기상태
          </button>
          <button
            onClick={() => {
              setConversationState("ai-speaking");
              setShowHint(false);
              setTextOpacity(1);
              setAiMessage("Hello! How are you today?");
              setShowInactivityMessage(false);
              resetTimers();
            }}
            className="rounded-full bg-blue-100 px-3 py-1 text-xs transition hover:bg-blue-200"
          >
            AI 말하는 중
          </button>
          <button
            onClick={() => {
              setConversationState("user-turn");
              setShowHint(false);
              setTextOpacity(1);
              setShowInactivityMessage(false);
              resetTimers();
              startInactivityTimer();
            }}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs transition hover:bg-gray-200"
          >
            사용자 차례
          </button>
          <button
            onClick={() => {
              setConversationState("user-speaking");
              setShowHint(false);
              setShowInactivityMessage(false);
              resetTimers();
            }}
            className="rounded-full bg-green-100 px-3 py-1 text-xs transition hover:bg-green-200"
          >
            듣는중
          </button>
          <button
            onClick={() => {
              setConversationState("user-turn");
              setShowHint(false);
              setTextOpacity(1);
              setAiMessage("I couldn't understand. Could you repeat that?");
              setShowInactivityMessage(false);
              resetTimers();
              startInactivityTimer();
            }}
            className="rounded-full bg-red-100 px-3 py-1 text-xs transition hover:bg-red-200"
          >
            인식실패
          </button>
          <button
            onClick={() => {
              setConversationState("ai-speaking");
              setShowHint(false);
              setTextOpacity(1);
              setAiMessage("Great answer! Let me respond to that...");
              setShowInactivityMessage(false);
              resetTimers();
              setTimeout(() => {
                setConversationState("user-turn");
                startInactivityTimer();
              }, 3000);
            }}
            className="rounded-full bg-teal-100 px-3 py-1 text-xs transition hover:bg-teal-200"
          >
            인식성공
          </button>
          <button
            onClick={() => {
              setConversationState("user-turn");
              setShowHint(true);
              setShowInactivityMessage(false);
              resetTimers();
            }}
            className="rounded-full bg-yellow-100 px-3 py-1 text-xs transition hover:bg-yellow-200"
          >
            힌트 표시
          </button>
          <button
            onClick={() => {
              setShowInactivityMessage(true);
              setConversationState("user-turn");
              clearInactivityTimer();
            }}
            className="rounded-full bg-orange-100 px-3 py-1 text-xs transition hover:bg-orange-200"
          >
            비활동 메시지
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

        <p className="mb-1 mt-2 text-xs font-bold text-gray-600">팝업 테스트용 링크</p>

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
      </div>
    </FullLayout>

    {/* Login Popup - 로그인 권유 팝업 */}
    {showLoginPopup && (
      <PopupLayout onClose={() => setShowLoginPopup(false)} maxWidth="md" showCloseButton={false}>
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Text */}
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-800 leading-relaxed">
              로그인을 하면 대화를 저장하고
              <br />
              이어 말할 수 있어요
            </p>
          </div>

          {/* Buttons - 한 행에 2개 */}
          <div className="flex w-full gap-3">
            <Button
              onClick={handleStopChat}
              variant="outline"
              className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              대화 그만하기
            </Button>
            <Button
              variant="primary"
              size="xl"
              onClick={handleLogin}
              className="flex-1"
            >
              로그인하기
            </Button>
          </div>
        </div>
      </PopupLayout>
    )}

    {/* Wait Popup - 응답 대기 팝업 */}
    {showWaitPopup && (
      <PopupLayout onClose={() => setShowWaitPopup(false)} maxWidth="md" showCloseButton={false}>
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Text */}
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-800 leading-relaxed">
              대화가 잠시 멈췄어요.
              <br />
              계속 이야기 할까요?
            </p>
          </div>

          {/* Buttons - 한 행에 2개 */}
          <div className="flex w-full gap-3">
            <Button
              onClick={handleStopFromWait}
              variant="outline"
              className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              대화 그만하기
            </Button>
            <Button
              variant="primary"
              size="xl"
              onClick={handleContinueChat}
              className="flex-1"
            >
              이어 말하기
            </Button>
          </div>
        </div>
      </PopupLayout>
    )}

    {/* End Chat Popup - 대화 종료 팝업 */}
    {showEndChatPopup && (
      <PopupLayout onClose={() => setShowEndChatPopup(false)} maxWidth="md" showCloseButton={false}>
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Text */}
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-800 leading-relaxed">
              지금은 여기까지만 할까요?
              <br />
              나중에 같은 주제로 다시 대화할 수 있어요.
            </p>
          </div>

          {/* Buttons - 한 행에 2개 */}
          <div className="flex w-full gap-3">
            <Button
              onClick={handleStopFromEnd}
              variant="outline"
              className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              대화 그만하기
            </Button>
            <Button
              variant="primary"
              size="xl"
              onClick={handleContinueFromEnd}
              className="flex-1"
            >
              이어 말하기
            </Button>
          </div>
        </div>
      </PopupLayout>
    )}
  </>
  );
}

