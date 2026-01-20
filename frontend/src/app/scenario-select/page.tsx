"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button, MalangEE, DebugStatus} from "@/shared/ui";
import {PopupLayout} from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import {FullLayout} from "@/shared/ui/FullLayout";
import {useScenarioChatNew} from "@/features/chat/hook/useScenarioChatNew";
import {useInactivityTimer} from "@/shared/hooks";
import {DirectSpeech, SubtitleSettings, VoiceSelection, TopicSuggestion} from "@/app/scenario-select/steps";
import { MapPin, Users, Target, Volume2, VolumeX } from "lucide-react";

export default function ScenarioSelectPage() {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [textOpacity, setTextOpacity] = useState(1);
    const [showNotUnderstood, setShowNotUnderstood] = useState(false);
    const [showEndChatPopup, setShowEndChatPopup] = useState(false);
    const [showScenarioResultPopup, setShowScenarioResultPopup] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // 음소거 상태 추가
    
    // 스텝 정의: 1:주제제안, 2:직접말하기, 3:자막설정, 4:목소리선택
    const [stepIndex, setStepIndex] = useState<1 | 2 | 3 | 4>(1);

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
    const hasError = hasStarted && !chatState.isConnected;

    const clearNotUnderstoodTimer = () => {
        if (notUnderstoodTimerRef.current) {
            clearTimeout(notUnderstoodTimerRef.current);
            notUnderstoodTimerRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            clearNotUnderstoodTimer();
            disconnect();
        };
    }, []);

    // 스텝 2(직접 말하기) 진입 시 자동 연결
    useEffect(() => {
        if (!hasStarted && stepIndex === 2 && !chatState.isConnected) {
            initAudio();
            connect();
            setHasStarted(true);
        }
    }, [hasStarted, stepIndex, chatState.isConnected]);

    useEffect(() => {
        if (chatState.isReady && stepIndex === 2 && !initialPromptSentRef.current) {
            startScenarioSession();
            initialPromptSentRef.current = true;
        }
    }, [chatState.isReady, stepIndex, startScenarioSession]);

    useEffect(() => {
        if (chatState.isReady && stepIndex === 2) {
            const pendingTopic = sessionStorage.getItem('pendingTopic');
            if (pendingTopic) {
                sessionStorage.removeItem('pendingTopic');
                sendText(pendingTopic);
            }
        }
    }, [chatState.isReady, stepIndex, sendText]);

    useEffect(() => {
        if (stepIndex !== 2) return;

        if (chatState.isAiSpeaking && chatState.isRecording) {
            stopMicrophone();
            setIsListening(false);
        }

        if (prevAiSpeakingRef.current && !chatState.isAiSpeaking && chatState.isReady && initialPromptSentRef.current && !chatState.isRecording) {
            startMicrophone();
            setIsListening(true);
        }

        prevAiSpeakingRef.current = chatState.isAiSpeaking;
    }, [chatState.isAiSpeaking, chatState.isReady, chatState.isRecording, stepIndex, startMicrophone, stopMicrophone]);

    const resetTimers = useCallback(() => {
        resetInactivityTimers();
        setShowNotUnderstood(false);
    }, [resetInactivityTimers]);

    useEffect(() => {
        if (stepIndex !== 2) return;

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
        if (stepIndex === 2 && chatState.scenarioResult) {
            resetTimers();
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
    }, [chatState.scenarioResult, stepIndex, stopMicrophone, resetTimers]);

    useEffect(() => {
        if (showScenarioResultPopup || showEndChatPopup) {
            resetTimers();
        }
    }, [showScenarioResultPopup, showEndChatPopup, resetTimers]);

    useEffect(() => {
        if (!chatState.aiMessage) return;
        setShowNotUnderstood(false);
        clearNotUnderstoodTimer();
    }, [chatState.aiMessage]);

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

    const handleTopicSelect = useCallback((topic: string) => {
        setStepIndex(2); // 직접 말하기 단계로 이동
        if (!chatState.isConnected) {
            connect();
            setHasStarted(true);
            sessionStorage.setItem('pendingTopic', topic);
        } else {
            sendText(topic);
        }
    }, [chatState.isConnected, connect, sendText]);

    const handleExitClick = () => {
        setShowEndChatPopup(true);
    };

    const handleMuteToggle = () => {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        toggleMute(newMuteState);
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
              그만두기
            </button>
          }
        >
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

          {/* 스텝별 컴포넌트 렌더링 */}
          {stepIndex === 1 && (
            <TopicSuggestion
              textOpacity={textOpacity}
              onTopicSelect={handleTopicSelect}
              onBack={() => setStepIndex(2)}
              onShowMore={() => {}}
            />
          )}

          {stepIndex === 2 && (
            <DirectSpeech
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
              onShowTopicSuggestion={() => setStepIndex(1)}
            />
          )}

          {stepIndex === 3 && <SubtitleSettings textOpacity={textOpacity} onNext={() => setStepIndex(4)} />}

          {stepIndex === 4 && <VoiceSelection textOpacity={textOpacity} onNext={() => {}} />}
        </FullLayout>

        {/* Step 4(목소리 선택)일 때만 DebugStatus 표시 */}
        {stepIndex === 4 && (
          <DebugStatus
            isConnected={chatState.isConnected}
            isReady={chatState.isReady}
            lastEvent={null}
            isAiSpeaking={chatState.isAiSpeaking}
            isUserSpeaking={chatState.isRecording}
            isMuted={isMuted}
            isRecording={chatState.isRecording}
            userTranscript={chatState.userTranscript}
          />
        )}

        {hasStarted && (
          <button
            onClick={handleMuteToggle}
            className={`fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${
              isMuted ? "bg-red-50 text-red-500" : "bg-white text-brand"
            } border border-gray-100`}
            title={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
          </button>
        )}

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
                  <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <MapPin size={20} className="text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-tight text-gray-400">연습 장소</span>
                      <p className="text-text-primary font-bold">{chatState.scenarioResult.place || "알수없음"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Users size={20} className="text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-tight text-gray-400">대화 상대</span>
                      <p className="text-text-primary font-bold">{chatState.scenarioResult.conversationPartner || "알수없음"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Target size={20} className="text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-tight text-gray-400">나의 미션</span>
                      <p className="text-text-primary font-bold leading-snug">{chatState.scenarioResult.conversationGoal || "알수없음"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex w-full gap-3">
                <Button
                  onClick={() => {
                    setShowScenarioResultPopup(false);
                    disconnect();
                    setIsListening(false);
                    setHasStarted(false);
                    setStepIndex(1); // 주제 제안으로 복귀
                    initialPromptSentRef.current = false;
                    prevAiSpeakingRef.current = false;
                  }}
                  variant="outline-purple"
                  className="flex-1"
                  size="lg"
                >
                  주제 다시 정하기
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setShowScenarioResultPopup(false);
                    setStepIndex(3); // 자막 설정으로 이동
                  }}
                  className="flex-1"
                >
                  다음단계
                </Button>
              </div>
            </div>
          </PopupLayout>
        )}

        {showEndChatPopup && (
          <PopupLayout
            onClose={() => setShowEndChatPopup(false)}
            maxWidth="md"
            showCloseButton={false}
          >
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="text-center">
                <p className="text-xl font-semibold leading-relaxed text-gray-800">
                  지금은 여기까지만 할까요?<br />언제든지 다시 시작할 수 있어요.
                </p>
              </div>
              <div className="flex w-full gap-3">
                <Button onClick={handleStopFromEnd} variant="outline-gray" size="md" className="flex-1">다음에 하기</Button>
                <Button variant="primary" size="md" onClick={handleContinueFromEnd} className="flex-1">이어 말하기</Button>
              </div>
            </div>
          </PopupLayout>
        )}
      </>
    );
}
