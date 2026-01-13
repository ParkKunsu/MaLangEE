"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MicButton, Button, MalangEE } from "@/shared/ui";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import { FullLayout } from "@/shared/ui/FullLayout";

/**
 * 시나리오 선택 페이지 상태
 * 0: 초기 상태 (대기)
 * 1: 음성 인식 중 (듣는 중)
 * 2: 인식 실패 (에러)
 * 3: 인식 성공 및 분석 중 (성공)
 */
type ScenarioState = 0 | 1 | 2 | 3;

export default function ScenarioSelectPage() {
  const router = useRouter();
  const [currentState, setCurrentState] = useState<ScenarioState>(0);
  const [isListening, setIsListening] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [showWaitPopup, setShowWaitPopup] = useState(false);
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 비활동 타이머 시작 (15초 후 메시지 표시)
  const startInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityMessage(true);
      setIsListening(true);
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
      setIsListening(false);
    }, 5000);
  };

  // 응답 대기 타이머 정리
  const clearWaitTimer = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearInactivityTimer();
      clearWaitTimer();
    };
  }, []);

  // 사용자 활동 시작 (타이머 초기화)
  const resetTimers = () => {
    clearInactivityTimer();
    clearWaitTimer();
    setShowInactivityMessage(false);
  };

  const handleMicClick = () => {
    if (currentState === 3) return;

    // 사용자 활동 - 타이머 리셋
    resetTimers();

    // Fade out text
    setTextOpacity(0);

    setTimeout(() => {
      if (currentState === 0 || currentState === 2) {
        // 대기 또는 에러 -> 듣는 중
        setCurrentState(1);
        setIsListening(true);
      } else if (currentState === 1) {
        // 듣는 중 -> 결과 처리 (시뮬레이션)
        // 실제로는 여기서 음성 데이터를 서버로 전송하고 결과를 기다립니다.
        const isSuccess = Math.random() > 0.2; // 80% 확률로 성공 시뮬레이션

        if (isSuccess) {
          setCurrentState(3);
          setIsListening(false);
          // 성공 시 1.5초 후 로그인 팝업 표시
          setTimeout(() => {
            setShowLoginPopup(true);
          }, 1500);
          // 비활동 타이머 시작
          startInactivityTimer();
        } else {
          setCurrentState(2);
          setIsListening(false);
        }
      }
      // Fade in text
      setTextOpacity(1);
    }, 300);
  };

  const getMainTitle = () => {
    if (showInactivityMessage) {
      return "말랭이가 대답을 기다리고 있어요.";
    }

    switch (currentState) {
      case 0:
        return "어떤 상황을 연습하고 싶은지\n편하게 말해보세요.";
      case 1:
        return "장소나 상황 또는 키워드로\n말씀해 주세요.";
      case 2:
        return "말랭이가 잘 이해하지 못했어요.";
      case 3:
        return "좋아요! 상황을 파악했어요.\n잠시만 기다려주세요.";
      default:
        return "";
    }
  };

  const getSubDesc = () => {
    if (showInactivityMessage) {
      return "Cheer up!";
    }

    switch (currentState) {
      case 0:
        return "마이크를 누르면 바로 시작돼요";
      case 1:
        return "다 듣고 나면 마이크를 다시 눌러주세요";
      case 2:
        return "다시 한번 말씀해 주시겠어요?";
      case 3:
        return "곧 연습을 시작할게요!";
      default:
        return "";
    }
  };

  const handleStopChat = () => {
    router.push("/auth/signup");
  };

  const handleLogin = () => {
    router.push("/auth/login");
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
        <div className="character-box">
          <MalangEE status={showInactivityMessage ? "humm" : "default"} size={150} />
        </div>

        {/* Text Group */}
        <div className="text-group text-center" style={{ opacity: textOpacity }}>
          <h1 className="scenario-title">{getMainTitle()}</h1>
          <p className="scenario-desc">{getSubDesc()}</p>
        </div>

        {/* Mic Button - Footer */}
        <div className="mt-6">
          <MicButton
            isListening={isListening}
            onClick={handleMicClick}
            size="md"
            className={currentState === 3 ? "pointer-events-none opacity-50" : ""}
          />
        </div>

          {/* 임시 테스트 링크들 */}
          <div className="mt-6 flex flex-col gap-2 items-center border-t pt-4">
            <p className="text-xs font-bold text-gray-600 mb-1">테스트용 링크</p>

            {/* 상황별 테스트 */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => {
                  setCurrentState(0);
                  setIsListening(false);
                  setShowInactivityMessage(false);
                }}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition"
              >
                초기 상태
              </button>
              <button
                onClick={() => {
                  setCurrentState(1);
                  setIsListening(true);
                  setShowInactivityMessage(false);
                }}
                className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full transition"
              >
                듣는 중
              </button>
              <button
                onClick={() => {
                  setCurrentState(2);
                  setIsListening(false);
                  setShowInactivityMessage(false);
                }}
                className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 rounded-full transition"
              >
                인식 실패
              </button>
              <button
                onClick={() => {
                  setCurrentState(3);
                  setIsListening(false);
                  setShowInactivityMessage(false);
                }}
                className="text-xs px-3 py-1 bg-green-100 hover:bg-green-200 rounded-full transition"
              >
                인식 성공
              </button>
              <button
                onClick={() => {
                  setShowInactivityMessage(true);
                  setIsListening(true);
                }}
                className="text-xs px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-full transition"
              >
                비활동 메시지
              </button>
            </div>

            {/* 팝업 테스트 */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <button
                onClick={() => setShowLoginPopup(true)}
                className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-full transition"
              >
                로그인 권유 팝업
              </button>
              <button
                onClick={() => setShowWaitPopup(true)}
                className="text-xs px-3 py-1 bg-orange-100 hover:bg-orange-200 rounded-full transition"
              >
                응답 대기 팝업
              </button>
              <button
                onClick={() => setShowEndChatPopup(true)}
                className="text-xs px-3 py-1 bg-pink-100 hover:bg-pink-200 rounded-full transition"
              >
                대화 종료 팝업
              </button>
            </div>
          </div>

      </FullLayout>

      {/* Login Popup */}
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
