"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button, MalangEE} from "@/shared/ui";
import {PopupLayout} from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import {FullLayout} from "@/shared/ui/FullLayout";
import {useScenarioChatNew} from "@/features/chat/hook/useScenarioChatNew"; // useScenarioChatNew 사용
import {useInactivityTimer} from "@/shared/hooks";
import {Step1} from "@/app/scenario-select/steps/Step1";
import {Step2} from "@/app/scenario-select/steps/Step2";
import {Step3} from "@/app/scenario-select/steps/Step3";
import {DebugStatus} from "@/shared/ui";

export default function ScenarioSelectPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<"topic" | "conversation">("topic");
    const [isListening, setIsListening] = useState(false);
    const [hasStarted, setHasStarted] = useState(false); // 대화 시작 여부
    const [textOpacity, setTextOpacity] = useState(1);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showNotUnderstood, setShowNotUnderstood] = useState(false);
    const [showEndChatPopup, setShowEndChatPopup] = useState(false);
    const [showScenarioResultPopup, setShowScenarioResultPopup] = useState(false);
    const [stepIndex, setStepIndex] = useState<1 | 2 | 3 | 4>(1);

    // 커스텀 훅 사용
    const {
        showInactivityMessage,
        showWaitPopup,
        startInactivityTimer,
        resetTimers: resetInactivityTimers,
        setShowWaitPopup
    } = useInactivityTimer();

    const loginTimerRef = useRef<NodeJS.Timeout | null>(null);
    const notUnderstoodTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialPromptSentRef = useRef(false);
    const aiSpeakingRef = useRef(false);
    const lastAiMessageRef = useRef("");
    const prevAiSpeakingRef = useRef(false);

    // useScenarioChatNew 훅 사용
    const {
        state: chatState,
        connect,
        disconnect,
        sendText,
        startMicrophone,
        stopMicrophone,
        initAudio,
        startScenarioSession,
    } = useScenarioChatNew();

    const hintMessage = "예: 공항 체크인 상황을 연습하고 싶어요.";
    // 에러: 대화 시작 후 예기치 않게 연결이 끊긴 경우
    const hasError = hasStarted && !chatState.isConnected;

    const clearLoginTimer = () => {
        if (loginTimerRef.current) {
            clearTimeout(loginTimerRef.current);
            loginTimerRef.current = null;
        }
    };

    const clearNotUnderstoodTimer = () => {
        if (notUnderstoodTimerRef.current) {
            clearTimeout(notUnderstoodTimerRef.current);
            notUnderstoodTimerRef.current = null;
        }
    };

    // 컴포넌트 언마운트 시 타이머 정리 및 연결 해제
    useEffect(() => {
        return () => {
            clearLoginTimer();
            clearNotUnderstoodTimer();
            disconnect();
        };
    }, [disconnect]);

    useEffect(() => {
        aiSpeakingRef.current = chatState.isAiSpeaking;
    }, [chatState.isAiSpeaking]);

    // WebSocket 연결 후 ready 상태가 되면 시나리오 세션 시작
    useEffect(() => {
        if (chatState.isReady && stepIndex === 1 && phase === "topic" && !initialPromptSentRef.current) {
            startScenarioSession();
            initialPromptSentRef.current = true;
        }
    }, [chatState.isReady, stepIndex, phase, startScenarioSession]);

    // AI 발화 관리 (Step 1에서)
    useEffect(() => {
        if (stepIndex !== 1) return;

        // AI가 말을 시작하면 마이크 중지
        if (chatState.isAiSpeaking && chatState.isRecording) {
            stopMicrophone();
            setIsListening(false);
        }

        // AI가 말을 끝낸 직후에만 자동으로 마이크 시작
        // prevAiSpeakingRef.current가 true였고, 현재 false가 된 경우
        if (prevAiSpeakingRef.current && !chatState.isAiSpeaking && chatState.isReady && initialPromptSentRef.current && !chatState.isRecording) {
            startMicrophone();
            setIsListening(true);
        }

        // 현재 상태를 저장
        prevAiSpeakingRef.current = chatState.isAiSpeaking;
    }, [chatState.isAiSpeaking, chatState.isReady, chatState.isRecording, stepIndex, startMicrophone, stopMicrophone]);

    // 사용자 활동 시작 (타이머 초기화)
    const resetTimers = useCallback(() => {
        resetInactivityTimers();
        setShowNotUnderstood(false);
    }, [resetInactivityTimers]);

    // 비활동 타이머 로직
    useEffect(() => {
        if (stepIndex !== 1 && stepIndex !== 4) return;

        // 대화 시작 전에는 타이머 작동하지 않음
        if (!hasStarted) {
            resetTimers();
            return;
        }

        if (chatState.isAiSpeaking || chatState.isRecording) {
            resetTimers();
            return;
        }

        startInactivityTimer();
    }, [chatState.isAiSpeaking, chatState.isRecording, stepIndex, hasStarted, startInactivityTimer, resetTimers]);

    useEffect(() => {
        // Phase가 topic일 때 시나리오가 선택되면 결과 팝업 표시
        if (stepIndex === 1 && phase === "topic") {
            if (chatState.scenarioResult) {
                resetTimers();
                setIsListening(false);
                stopMicrophone();

                // 시나리오 결과 로컬 스토리지에 저장
                if (typeof window !== "undefined") {
                    const { conversationGoal, conversationPartner, place } = chatState.scenarioResult;
                    if (conversationGoal) localStorage.setItem("conversationGoal", conversationGoal);
                    if (conversationPartner) localStorage.setItem("conversationPartner", conversationPartner);
                    if (place) localStorage.setItem("place", place);
                }

                setShowScenarioResultPopup(true);
            }
        }
    }, [
        chatState.scenarioResult,
        phase,
        stepIndex,
        stopMicrophone,
        resetTimers
    ]);

    // 팝업이 떠있을 때 타이머 초기화 (사용자 확인 대기 중)
    useEffect(() => {
        if (showScenarioResultPopup || showLoginPopup || showWaitPopup || showEndChatPopup) {
            resetTimers();
        }
    }, [showScenarioResultPopup, showLoginPopup, showWaitPopup, showEndChatPopup, resetTimers]);

    useEffect(() => {
        if (stepIndex === 4 && phase === "topic") {
           setPhase("conversation");
           setIsListening(true);
           startInactivityTimer();
            if (!loginTimerRef.current) {
                loginTimerRef.current = setTimeout(() => {
                    resetTimers(); // 비활동 타이머 초기화
                    setShowLoginPopup(true);
                    setIsListening(false);
                    stopMicrophone();
                }, 10 * 60 * 1000);
            }
        }
    }, [stepIndex, phase, startInactivityTimer, stopMicrophone, resetTimers]);

    useEffect(() => {
        if (phase !== "conversation") return;
        if (!chatState.isReady || initialPromptSentRef.current) return;

        sendText("Hello! Start a conversation with me.");
        initialPromptSentRef.current = true;
    }, [chatState.isReady, phase, sendText]);

    useEffect(() => {
        if (!chatState.aiMessage) return;

        lastAiMessageRef.current = chatState.aiMessage;
        setShowNotUnderstood(false);
        clearNotUnderstoodTimer();
    }, [chatState.aiMessage]);

    useEffect(() => {
        if (!chatState.userTranscript) return;

        setShowNotUnderstood(false);
        clearNotUnderstoodTimer();
        const snapshotAiMessage = lastAiMessageRef.current;

        notUnderstoodTimerRef.current = setTimeout(() => {
            if (aiSpeakingRef.current) return;
            if (lastAiMessageRef.current !== snapshotAiMessage) return;
            setShowNotUnderstood(true);
        }, 5000);
    }, [chatState.userTranscript]);

    useEffect(() => {
        if (phase !== "conversation") return;

        if (chatState.isRecording) {
            setIsListening(true);
            setShowNotUnderstood(false);
            return;
        }

        if (chatState.isAiSpeaking) {
            setIsListening(false);
            setShowNotUnderstood(false);
        }
    }, [chatState.isAiSpeaking, chatState.isRecording, phase]);

    const endChatAndGoLogin = useCallback(() => {
        resetTimers();
        clearLoginTimer();
        setShowWaitPopup(false);
        setShowEndChatPopup(false);
        setIsListening(false);
        stopMicrophone();
        disconnect();
        router.push("/auth/login");
    }, [disconnect, router, stopMicrophone, resetTimers]);

    const handleStopChat = () => {
        endChatAndGoLogin();
    };

    const handleLogin = () => {
        endChatAndGoLogin();
    };

    const handleContinueChat = () => {
        setShowWaitPopup(false);
        resetTimers();
        startInactivityTimer();
        setIsListening(true);
        startMicrophone();
    };

    const handleStopFromWait = () => {
        endChatAndGoLogin();
    };

    const handleContinueFromEnd = () => {
        setShowEndChatPopup(false);
        resetTimers();
        startInactivityTimer();
        setIsListening(true);
        startMicrophone();
    };

    const handleStopFromEnd = () => {
        endChatAndGoLogin();
    };

    return (
      <>
        <DebugStatus
          isConnected={chatState.isConnected}
          lastEvent=""
          isAiSpeaking={chatState.isAiSpeaking}
          isUserSpeaking={chatState.isRecording}
        />

        <FullLayout showHeader={true}>
          {/* Character */}
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

          {/*
             Step 1: Topic Selection (Use Step1 component in 'topic' phase)
             Step 2: Subtitle (Use Step2 component)
             Step 3: Voice (Use Step3 component)
             Step 4: Conversation (Use Step4 component in 'conversation' phase)
          */}

          {stepIndex === 1 && (
            <Step1
              textOpacity={textOpacity}
              isListening={isListening}
              isLocalSpeaking={chatState.isRecording}
              isAiSpeaking={chatState.isAiSpeaking}
              isUserSpeaking={chatState.isRecording}
              hasError={hasError}
              phase="topic"
              showInactivityMessage={showInactivityMessage}
              showNotUnderstood={showNotUnderstood}
              aiMessage={chatState.aiMessage}
              aiMessageKR={chatState.aiMessageKR}
              userTranscript={chatState.userTranscript}
              resetTimers={resetTimers}
              startRecording={startMicrophone}
              stopRecording={stopMicrophone}
              setIsListening={setIsListening}
              setTextOpacity={setTextOpacity}
              initAudio={initAudio}
              onNext={() => {}} // 자막 설정으로 자동 이동됨 (useEffect)
              chatState={chatState as any} // 타입 호환성 임시 처리 (필요시 수정)
              connect={connect}
              startScenarioSession={startScenarioSession}
              hasStarted={hasStarted}
              setHasStarted={setHasStarted}
            />
          )}

          {stepIndex === 2 && <Step2 textOpacity={textOpacity} onNext={() => setStepIndex(3)} />}

          {stepIndex === 3 && <Step3 textOpacity={textOpacity} onNext={() => setStepIndex(4)} />}
        </FullLayout>

        {/* 시나리오 결과 확인 팝업 */}
        {showScenarioResultPopup && chatState.scenarioResult && (
          <PopupLayout
            onClose={() => setShowScenarioResultPopup(false)}
            maxWidth="md"
            showCloseButton={false}
          >
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="space-y-4 text-center">
                <p className="text-text-primary text-xl font-bold">좋아요! 상황을 파악했어요.</p>
                <div className="bg-brand-50 border-brand-200 space-y-2 rounded-2xl border p-4 text-left">
                  <p className="text-text-secondary text-sm">
                    <span className="text-brand mr-2 font-bold">미션:</span>
                    {chatState.scenarioResult.conversationGoal || "알수없음"}
                  </p>
                  <p className="text-text-secondary text-sm">
                    <span className="text-brand mr-2 font-bold">상대:</span>
                    {chatState.scenarioResult.conversationPartner || "알수없음"}
                  </p>
                  <p className="text-text-secondary text-sm">
                    <span className="text-brand mr-2 font-bold">장소:</span>
                    {chatState.scenarioResult.place || "알수없음"}
                  </p>
                </div>
              </div>
              <div className="flex w-full gap-3">
                <Button
                  onClick={() => {
                    setShowScenarioResultPopup(false);
                    disconnect(); // 기존 연결 해제
                    setIsListening(false);
                    setHasStarted(false); // 대화 시작 상태 초기화
                    setStepIndex(1); // 주제 다시 정하기
                    initialPromptSentRef.current = false; // 재시작을 위해 리셋
                    // 재연결은 마이크 클릭 시 자동으로 이루어짐
                  }}
                  variant="outline-purple"
                  className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  주제 다시 정하기
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setShowScenarioResultPopup(false);
                    setStepIndex(2); // 자막 설정하기로 이동
                  }}
                  className="flex-1"
                >
                  다음단계
                </Button>
              </div>
            </div>
          </PopupLayout>
        )}

        {/* Login Popup */}
        {showLoginPopup && (
          <PopupLayout
            onClose={() => setShowLoginPopup(false)}
            maxWidth="md"
            showCloseButton={false}
          >
            <div className="flex flex-col items-center gap-6 py-6">
              {/* Text */}
              <div className="text-center">
                <p className="text-xl font-semibold leading-relaxed text-gray-800">
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
                <Button variant="primary" size="xl" onClick={handleLogin} className="flex-1">
                  로그인하기
                </Button>
              </div>
            </div>
          </PopupLayout>
        )}

        {/* Wait Popup - 응답 대기 팝업 */}
        {showWaitPopup && (
          <PopupLayout
            onClose={() => setShowWaitPopup(false)}
            maxWidth="md"
            showCloseButton={false}
          >
            <div className="flex flex-col items-center gap-6 py-6">
              {/* Text */}
              <div className="text-center">
                <p className="text-xl font-semibold leading-relaxed text-gray-800">
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
                <Button variant="primary" size="xl" onClick={handleContinueChat} className="flex-1">
                  이어 말하기
                </Button>
              </div>
            </div>
          </PopupLayout>
        )}

        {/* End Chat Popup - 대화 종료 팝업 */}
        {showEndChatPopup && (
          <PopupLayout
            onClose={() => setShowEndChatPopup(false)}
            maxWidth="md"
            showCloseButton={false}
          >
            <div className="flex flex-col items-center gap-6 py-6">
              {/* Text */}
              <div className="text-center">
                <p className="text-xl font-semibold leading-relaxed text-gray-800">
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
