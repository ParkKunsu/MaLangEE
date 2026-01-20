"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button, MalangEE} from "@/shared/ui";
import {PopupLayout} from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import {FullLayout} from "@/shared/ui/FullLayout";
import {useScenarioChatNew} from "@/features/chat/hook/useScenarioChatNew"; // useScenarioChatNew 사용
import {useInactivityTimer} from "@/shared/hooks";
import {Step1, Step2, Step3, TopicSuggestion} from "@/app/scenario-select/steps";
import { MapPin, Users, Target } from "lucide-react";

export default function ScenarioSelectPage() {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [hasStarted, setHasStarted] = useState(false); // 대화 시작 여부
    const [textOpacity, setTextOpacity] = useState(1);
    const [showNotUnderstood, setShowNotUnderstood] = useState(false);
    const [showEndChatPopup, setShowEndChatPopup] = useState(false);
    const [showScenarioResultPopup, setShowScenarioResultPopup] = useState(false);
    const [stepIndex, setStepIndex] = useState<1 | 2 | 3>(1);
    const [isMuted, setIsMuted] = useState(false); // 음소거 상태
    const [showTopicSuggestion, setShowTopicSuggestion] = useState(false); // 주제 제안 표시 여부

    // 커스텀 훅 사용
    const {
        showInactivityMessage,
        startInactivityTimer,
        resetTimers: resetInactivityTimers,
    } = useInactivityTimer();

    const notUnderstoodTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialPromptSentRef = useRef(false);
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
        toggleMute,
    } = useScenarioChatNew();

    const hintMessage = "예: 공항 체크인 상황을 연습하고 싶어요.";
    // 에러: 대화 시작 후 예기치 않게 연결이 끊긴 경우
    const hasError = hasStarted && !chatState.isConnected;

    const clearNotUnderstoodTimer = () => {
        if (notUnderstoodTimerRef.current) {
            clearTimeout(notUnderstoodTimerRef.current);
            notUnderstoodTimerRef.current = null;
        }
    };

    // 컴포넌트 언마운트 시 타이머 정리 및 연결 해제
    useEffect(() => {
        return () => {
            clearNotUnderstoodTimer();
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 페이지 로드 시 자동으로 연결 시작 (재연결도 포함)
    useEffect(() => {
        if (!hasStarted && stepIndex === 1 && !chatState.isConnected) {
            initAudio();
            connect();
            setHasStarted(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasStarted, stepIndex, chatState.isConnected]); // hasStarted가 false로 변경되면 재실행

    // WebSocket 연결 후 ready 상태가 되면 시나리오 세션 시작
    useEffect(() => {
        if (chatState.isReady && stepIndex === 1 && !initialPromptSentRef.current) {
            startScenarioSession();
            initialPromptSentRef.current = true;
        }
    }, [chatState.isReady, stepIndex, startScenarioSession]);

    // ready 상태일 때 pendingTopic 확인하여 전송
    useEffect(() => {
        if (chatState.isReady && stepIndex === 1) {
            const pendingTopic = sessionStorage.getItem('pendingTopic');
            if (pendingTopic) {
                sessionStorage.removeItem('pendingTopic');
                sendText(pendingTopic);
            }
        }
    }, [chatState.isReady, stepIndex, sendText]);

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

    // 비활동 타이머 로직 (Step 1에서만)
    useEffect(() => {
        if (stepIndex !== 1) return;

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
        // 시나리오가 선택되면 결과 팝업 표시
        if (stepIndex === 1 && chatState.scenarioResult) {
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
    }, [
        chatState.scenarioResult,
        stepIndex,
        stopMicrophone,
        resetTimers
    ]);

    // 팝업이 떠있을 때 타이머 초기화 (사용자 확인 대기 중)
    useEffect(() => {
        if (showScenarioResultPopup || showEndChatPopup) {
            resetTimers();
        }
    }, [showScenarioResultPopup, showEndChatPopup, resetTimers]);

    // AI 메시지 수신 시 "이해 못함" 상태 초기화
    useEffect(() => {
        if (!chatState.aiMessage) return;

        setShowNotUnderstood(false);
        clearNotUnderstoodTimer();
    }, [chatState.aiMessage]);

    // 사용자 발화 후 일정 시간 내 AI 응답 없으면 "이해 못함" 표시
    useEffect(() => {
        if (!chatState.userTranscript) return;

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

    // 주제 선택 핸들러
    const handleTopicSelect = useCallback((topic: string) => {
        setShowTopicSuggestion(false);

        // 연결이 안 되어 있으면 연결 시작
        if (!chatState.isConnected) {
            connect();
            setHasStarted(true);
            // ready 이벤트 대기 후 텍스트 전송 (useEffect에서 처리)
            sessionStorage.setItem('pendingTopic', topic);
        } else {
            // 이미 연결되어 있으면 바로 전송
            sendText(topic);
        }
    }, [chatState.isConnected, connect, sendText]);

    // Layout의 DebugStatus에 상태 전달 (CustomEvent)
    useEffect(() => {
        const debugStatus = {
            isConnected: chatState.isConnected,
            isReady: chatState.isReady,
            lastEvent: null,
            isAiSpeaking: chatState.isAiSpeaking,
            isUserSpeaking: chatState.isRecording,
            isMuted: isMuted,
            isRecording: chatState.isRecording,
            userTranscript: chatState.userTranscript,
        };

        window.dispatchEvent(
            new CustomEvent("scenario-debug-status", {
                detail: debugStatus,
            })
        );
    }, [
        chatState.isConnected,
        chatState.isReady,
        chatState.isAiSpeaking,
        chatState.isRecording,
        chatState.userTranscript,
        isMuted,
    ]);

    // 헤더 종료 버튼 클릭 핸들러
    const handleExitClick = () => {
        setShowEndChatPopup(true);
    };

    return (
      <>
        <FullLayout
          showHeader={true}
          headerRight={
            <button
              onClick={handleExitClick}
              className="btn-exit text-text-secondary hover:text-text-primary transition-colors"
            >
              대화 종료하기
            </button>
          }
        >
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

          {/* Steps: 1. 주제 선택 → 2. 자막 설정 → 3. 목소리 선택 → 대화 시작 */}

          {stepIndex === 1 && !showTopicSuggestion && (
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
              onNext={() => {}}
              chatState={chatState}
              connect={connect}
              startScenarioSession={startScenarioSession}
              hasStarted={hasStarted}
              setHasStarted={setHasStarted}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              toggleMute={toggleMute}
              onShowTopicSuggestion={() => setShowTopicSuggestion(true)}
            />
          )}

          {stepIndex === 1 && showTopicSuggestion && (
            <TopicSuggestion
              textOpacity={textOpacity}
              onTopicSelect={handleTopicSelect}
              onBack={() => setShowTopicSuggestion(false)}
              onShowMore={() => {}} // TopicSuggestion 내부에서 랜덤 주제 갱신 처리
            />
          )}

          {stepIndex === 2 && <Step2 textOpacity={textOpacity} onNext={() => setStepIndex(3)} />}

          {stepIndex === 3 && <Step3 textOpacity={textOpacity} onNext={() => {}} />}
        </FullLayout>

        {/* 시나리오 결과 확인 팝업 */}
        {showScenarioResultPopup && chatState.scenarioResult && (
          <PopupLayout
            onClose={() => setShowScenarioResultPopup(false)}
            maxWidth="md"
            showCloseButton={false}
          >
            <div className="flex flex-col items-center gap-8 py-6">
              <div className="w-full space-y-6">
                <div className="text-center">
                  <h2 className="text-text-primary text-2xl font-bold tracking-tight">좋아요! 상황을 파악했어요.</h2>
                  <p className="text-text-secondary mt-2 text-sm">연습할 시나리오 정보를 확인해주세요.</p>
                </div>

                <div className="grid gap-3">
                  {/* 장소 */}
                  <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <MapPin size={20} className="text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">연습 장소</span>
                      <p className="text-text-primary font-bold">{chatState.scenarioResult.place || "알수없음"}</p>
                    </div>
                  </div>

                  {/* 상대 */}
                  <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Users size={20} className="text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">대화 상대</span>
                      <p className="text-text-primary font-bold">{chatState.scenarioResult.conversationPartner || "알수없음"}</p>
                    </div>
                  </div>

                  {/* 미션 */}
                  <div className="flex items-start gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mt-0.5">
                      <Target size={20} className="text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">나의 미션</span>
                      <p className="text-text-primary font-bold leading-snug">{chatState.scenarioResult.conversationGoal || "알수없음"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-full gap-3 mt-2">
                <Button
                  onClick={() => {
                    setShowScenarioResultPopup(false);
                    disconnect();
                    setIsListening(false);
                    setHasStarted(false);
                    setStepIndex(1);
                    initialPromptSentRef.current = false;
                    prevAiSpeakingRef.current = false;
                  }}
                  variant="outline-purple"
                  className="h-14 flex-1 rounded-2xl border-2 border-gray-200 text-base font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  주제 다시 정하기
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setShowScenarioResultPopup(false);
                    setStepIndex(2);
                  }}
                  className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-brand/20"
                >
                  다음단계
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
