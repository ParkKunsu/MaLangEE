"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button, MalangEE} from "@/shared/ui";
import {PopupLayout} from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import {FullLayout} from "@/shared/ui/FullLayout";
import {useScenarioChat} from "@/features/chat";
import {useInactivityTimer} from "@/shared/hooks";
import {Step1} from "@/app/demo/steps/Step1";
import {Step2} from "@/app/demo/steps/Step2";
import {Step3} from "@/app/demo/steps/Step3";

export default function ScenarioSelectPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<"topic" | "conversation">("topic");
    const [isListening, setIsListening] = useState(false);
    const [textOpacity, setTextOpacity] = useState(1);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showNotUnderstood, setShowNotUnderstood] = useState(false);
    const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
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
    const localSpeakingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialPromptSentRef = useRef(false);
    const aiSpeakingRef = useRef(false);
    const lastAiMessageRef = useRef("");
    const localSpeakingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const {
        state: chatState,
        connect,
        disconnect,
        sendText,
        sendAudioChunk,
        initAudio,
    } = useScenarioChat();
    const hintMessage = "예: 공항 체크인 상황을 연습하고 싶어요.";
    const hasError = Boolean(chatState.error);

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

    const clearLocalSpeakingTimer = () => {
        if (localSpeakingTimerRef.current) {
            clearTimeout(localSpeakingTimerRef.current);
            localSpeakingTimerRef.current = null;
        }
    };

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            clearLoginTimer();
            clearNotUnderstoodTimer();
            clearLocalSpeakingTimer();
        };
    }, []);

    const updateLocalSpeaking = useCallback((level: number) => {
        const threshold = 0.02;
        const hangMs = 400;

        if (level >= threshold) {
            clearLocalSpeakingTimer();
            if (!localSpeakingRef.current) {
                localSpeakingRef.current = true;
                setIsLocalSpeaking(true);
            }
            return;
        }

        if (localSpeakingRef.current && !localSpeakingTimerRef.current) {
            localSpeakingTimerRef.current = setTimeout(() => {
                localSpeakingRef.current = false;
                setIsLocalSpeaking(false);
                localSpeakingTimerRef.current = null;
            }, hangMs);
        }
    }, []);

    const startRecording = useCallback(async () => {
        if (streamRef.current) return;
        const getMediaStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                return navigator.mediaDevices.getUserMedia(constraints);
            }
            const legacyApi = (navigator as any).webkitGetUserMedia ||
                (navigator as any).mozGetUserMedia ||
                (navigator as any).msGetUserMedia;
            if (legacyApi) {
                return new Promise((resolve, reject) => {
                    legacyApi.call(navigator, constraints, resolve, reject);
                });
            }
            throw new Error("MEDIA_API_NOT_SUPPORTED");
        };

        try {
            const constraints = {
                audio: {
                    sampleRate: {ideal: 16000},
                    channelCount: {ideal: 1},
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            };

            let stream: MediaStream;
            try {
                stream = await getMediaStream(constraints);
            } catch (err) {
                console.warn("[Recording] Preferred constraints failed. Trying basic fallback...", err);
                stream = await getMediaStream({audio: true});
            }

            streamRef.current = stream;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({sampleRate: 16000});

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const float32Data = new Float32Array(inputData);
                let sum = 0;
                for (let i = 0; i < float32Data.length; i += 1) {
                    sum += float32Data[i] * float32Data[i];
                }
                const rms = Math.sqrt(sum / float32Data.length);
                updateLocalSpeaking(rms);
                sendAudioChunk(float32Data);
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);
        } catch (error) {
            console.error("[Recording] Failed to start:", error);
            if (error instanceof Error && (error.message === "MEDIA_API_NOT_SUPPORTED" || error.name === "NotAllowedError")) {
                alert("마이크 사용이 필요합니다.\nHTTPS 연결(또는 localhost)인지 확인하고 마이크 권한을 허용해주세요.");
            }
            setIsListening(false);
            setIsLocalSpeaking(false);
            localSpeakingRef.current = false;
            clearLocalSpeakingTimer();
        }
    }, [sendAudioChunk, updateLocalSpeaking]);

    const stopRecording = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsLocalSpeaking(false);
        localSpeakingRef.current = false;
        clearLocalSpeakingTimer();
    }, []);

    useEffect(() => {
        connect();
        return () => {
            stopRecording();
            disconnect();
        };
    }, [connect, disconnect, stopRecording]);

    useEffect(() => {
        aiSpeakingRef.current = chatState.isAiSpeaking;
    }, [chatState.isAiSpeaking]);

    // 사용자 활동 시작 (타이머 초기화)
    const resetTimers = useCallback(() => {
        resetInactivityTimers();
        setShowNotUnderstood(false);
    }, [resetInactivityTimers]);

    // 비활동 타이머 로직
    useEffect(() => {
        if (stepIndex !== 1 && stepIndex !== 4) return;

        if (chatState.isAiSpeaking || chatState.isUserSpeaking || isLocalSpeaking) {
            resetTimers();
            return;
        }

        startInactivityTimer();
    }, [chatState.isAiSpeaking, chatState.isUserSpeaking, isLocalSpeaking, stepIndex, startInactivityTimer, resetTimers]);

    useEffect(() => {
        // Phase가 topic일 때 시나리오가 선택되면 결과 팝업 표시
        if (stepIndex === 1 && phase === "topic") {
            if (chatState.isCompleted) {
                resetTimers();
                setIsListening(false);
                stopRecording();
                setShowScenarioResultPopup(true);
            }
        }
    }, [
        chatState.isCompleted,
        phase,
        stepIndex,
        stopRecording,
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
                    stopRecording();
                }, 10 * 60 * 1000);
            }
        }
    }, [stepIndex, phase, startInactivityTimer, stopRecording, resetTimers]);

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

        const userSpeaking = chatState.isUserSpeaking || isLocalSpeaking;

        if (userSpeaking) {
            setIsListening(true);
            setShowNotUnderstood(false);
            return;
        }

        if (chatState.isAiSpeaking) {
            setIsListening(false);
            setShowNotUnderstood(false);
        }
    }, [chatState.isAiSpeaking, chatState.isUserSpeaking, isLocalSpeaking, phase]);

    const endChatAndGoLogin = useCallback(() => {
        resetTimers();
        clearLoginTimer();
        setShowWaitPopup(false);
        setShowEndChatPopup(false);
        setIsListening(false);
        stopRecording();
        disconnect();
        router.push("/auth/login");
    }, [disconnect, router, stopRecording, resetTimers]);

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
        startRecording();
    };

    const handleStopFromWait = () => {
        endChatAndGoLogin();
    };

    const handleContinueFromEnd = () => {
        setShowEndChatPopup(false);
        resetTimers();
        startInactivityTimer();
        setIsListening(true);
        startRecording();
    };

    const handleStopFromEnd = () => {
        endChatAndGoLogin();
    };

    return (
      <>
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
              isLocalSpeaking={isLocalSpeaking}
              isAiSpeaking={chatState.isAiSpeaking}
              isUserSpeaking={chatState.isUserSpeaking}
              hasError={hasError}
              phase="topic"
              showInactivityMessage={showInactivityMessage}
              showNotUnderstood={showNotUnderstood}
              aiMessage={chatState.aiMessage}
              aiMessageKR={chatState.aiMessageKR}
              userTranscript={chatState.userTranscript}
              resetTimers={resetTimers}
              startRecording={startRecording}
              stopRecording={stopRecording}
              setIsListening={setIsListening}
              setTextOpacity={setTextOpacity}
              initAudio={initAudio}
              onNext={() => {}} // 자막 설정으로 자동 이동됨 (useEffect)
            />
          )}

          {stepIndex === 2 && <Step2 textOpacity={textOpacity} onNext={() => setStepIndex(3)} />}

          {stepIndex === 3 && <Step3 textOpacity={textOpacity} onNext={() => setStepIndex(4)} />}

          {stepIndex === 4 && (
            <Step4
              textOpacity={textOpacity}
              isListening={isListening}
              isLocalSpeaking={isLocalSpeaking}
              isAiSpeaking={chatState.isAiSpeaking}
              isUserSpeaking={chatState.isUserSpeaking}
              hasError={hasError}
              phase="conversation"
              showInactivityMessage={showInactivityMessage}
              showNotUnderstood={showNotUnderstood}
              aiMessage={chatState.aiMessage}
              aiMessageKR={chatState.aiMessageKR}
              userTranscript={chatState.userTranscript}
              resetTimers={resetTimers}
              startRecording={startRecording}
              stopRecording={stopRecording}
              setIsListening={setIsListening}
              setTextOpacity={setTextOpacity}
              initAudio={initAudio}
              onNext={() => {}}
            />
          )}
        </FullLayout>

        {/* 디버깅용 이벤트 상태 표시 */}
        <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-black/70 px-3 py-1 text-[10px] text-white backdrop-blur-md">
            <div className="flex items-center gap-1">
              <div
                className={`h-1.5 w-1.5 rounded-full ${chatState.isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span>{chatState.isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
            </div>
            {chatState.lastEvent && (
              <div className="border-l border-white/20 pl-3">
                LAST EVENT:{" "}
                <span className="font-mono text-yellow-400">
                  {chatState.lastEvent.toUpperCase()}
                </span>
              </div>
            )}
            {chatState.isAiSpeaking && (
              <div className="animate-pulse border-l border-white/20 pl-3 text-blue-400">
                AI SPEAKING...
              </div>
            )}
          </div>
        </div>

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
                    {chatState.scenarioResult.conversationGoal || "대화하기"}
                  </p>
                  <p className="text-text-secondary text-sm">
                    <span className="text-brand mr-2 font-bold">상대:</span>
                    {chatState.scenarioResult.conversationPartner || "말랭이"}
                  </p>
                  <p className="text-text-secondary text-sm">
                    <span className="text-brand mr-2 font-bold">장소:</span>
                    {chatState.scenarioResult.place || "어딘가"}
                  </p>
                </div>
              </div>
              <div className="flex w-full gap-3">
                <Button
                  onClick={() => {
                    setShowScenarioResultPopup(false);
                    setStepIndex(1); // 주제 다시 정하기
                    connect(); // 재연결
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
