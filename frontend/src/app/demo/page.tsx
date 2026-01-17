"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button, MalangEE} from "@/shared/ui";
import {PopupLayout} from "@/shared/ui/PopupLayout";
import "@/shared/styles/scenario.css";
import {FullLayout} from "@/shared/ui/FullLayout";
import {useScenarioChat} from "@/features/chat";
import {Step1} from "@/app/demo/steps/Step1";
import {Step2} from "@/app/demo/steps/Step2";
import {Step3} from "@/app/demo/steps/Step3";

export default function ScenarioSelectPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<"topic" | "conversation">("topic");
    const [isListening, setIsListening] = useState(false);
    const [textOpacity, setTextOpacity] = useState(1);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showInactivityMessage, setShowInactivityMessage] = useState(false);
    const [showNotUnderstood, setShowNotUnderstood] = useState(false);
    const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
    const [showWaitPopup, setShowWaitPopup] = useState(false);
    const [showEndChatPopup, setShowEndChatPopup] = useState(false);
    const [stepIndex, setStepIndex] = useState<1 | 2 | 3 | 4>(1);

    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const waitTimerRef = useRef<NodeJS.Timeout | null>(null);
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
    } = useScenarioChat();
    const hintMessage = "예: 공항 체크인 상황을 연습하고 싶어요.";
    const hasError = Boolean(chatState.error);

    // 비활동 타이머 시작 (15초 후 메시지 표시)
    const startInactivityTimer = () => {
        clearInactivityTimer();
        inactivityTimerRef.current = setTimeout(() => {
            setShowInactivityMessage(true);
            setIsListening(true);
            startRecording();
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
            stopRecording();
        }, 5000);
    };

    // 응답 대기 타이머 정리
    const clearWaitTimer = () => {
        if (waitTimerRef.current) {
            clearTimeout(waitTimerRef.current);
            waitTimerRef.current = null;
        }
    };

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
            clearInactivityTimer();
            clearWaitTimer();
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
                sendAudioChunk(float32Data, 16000);
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
        setIsListening(true);
        startRecording();
        return () => {
            stopRecording();
            disconnect();
        };
    }, [connect, disconnect, startRecording, stopRecording]);

    useEffect(() => {
        aiSpeakingRef.current = chatState.isAiSpeaking;
    }, [chatState.isAiSpeaking]);

    useEffect(() => {
        // Phase가 topic일 때 시나리오가 선택되면 다음 단계(자막 설정)로 이동
        if (stepIndex === 1 && phase === "topic") {
            // 수정: 타입 단언을 사용하여 scenarioInfo 속성 접근 허용
            const scenarioSelected = Boolean((chatState as any).scenarioInfo);

            // 사용자 발화가 있어도(fallbackSelected) 일단 진행할지 여부:
            // 시나리오 선택 모드에서는 확실히 scenarioInfo가 나왔을 때 넘어가는 게 맞음
            if (scenarioSelected) {
                // Topic 선정 완료 -> 자막 설정(Step 2)으로 이동
                setStepIndex(2);
                // 녹음 중지
                setIsListening(false);
                stopRecording();
            }
        }
    }, [
        (chatState as any).scenarioInfo,
        chatState.userTranscript,
        phase,
        stepIndex,
        stopRecording
    ]);

    useEffect(() => {
        if (stepIndex === 4 && phase === "topic") {
           setPhase("conversation");
           setIsListening(true);
           startInactivityTimer();
            if (!loginTimerRef.current) {
                loginTimerRef.current = setTimeout(() => {
                    clearInactivityTimer();
                    clearWaitTimer();
                    setShowLoginPopup(true);
                    setIsListening(false);
                    stopRecording();
                }, 10 * 60 * 1000);
            }
        }
    }, [stepIndex, phase, startInactivityTimer, clearInactivityTimer, clearWaitTimer, stopRecording]);

    useEffect(() => {
        if (phase !== "conversation") return;
        if (!chatState.isReady || initialPromptSentRef.current) return;

        // AI가 먼저 말을 걸도록 텍스트 전송
        // 주제정보가 있다면 포함해서 보내는 것이 좋음
        const scenarioInfo = (chatState as any).scenarioInfo;
        let prompt = "여행이나 식당같은 주제로 대화를 시작해볼까요?";

        if (scenarioInfo) {
             const place = scenarioInfo.place || "장소";
             const partner = scenarioInfo.conversationPartner || "상대방";
             const goal = scenarioInfo.conversationGoal || "목표";
             prompt = `지금부터 상황극을 시작합니다. 당신은 ${place}에서 ${partner} 역할을 맡아주세요. 사용자의 목표는 ${goal}입니다. 먼저 사용자에게 말을 걸어주세요.`;
        }

        sendText(prompt);
        initialPromptSentRef.current = true;
    }, [chatState.isReady, phase, sendText, chatState]);

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

    useEffect(() => {
        if (phase !== "conversation") return;

        if (chatState.isAiSpeaking || chatState.isUserSpeaking || isLocalSpeaking) {
            clearInactivityTimer();
            clearWaitTimer();
            setShowInactivityMessage(false);
            clearNotUnderstoodTimer();
            return;
        }

        startInactivityTimer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatState.isAiSpeaking, chatState.isUserSpeaking, isLocalSpeaking, phase]);

    // 사용자 활동 시작 (타이머 초기화)
    const resetTimers = () => {
        clearInactivityTimer();
        clearWaitTimer();
        setShowInactivityMessage(false);
        setShowNotUnderstood(false);
    };

    const endChatAndGoLogin = useCallback(() => {
        clearInactivityTimer();
        clearWaitTimer();
        clearLoginTimer();
        setShowWaitPopup(false);
        setShowEndChatPopup(false);
        setShowInactivityMessage(false);
        setIsListening(false);
        stopRecording();
        disconnect();
        router.push("/auth/login");
    }, [disconnect, router, stopRecording]);

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
             Step 4: Conversation (Use Step1 component in 'conversation' phase)
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
              userTranscript={chatState.userTranscript} // 자막 데이터 전달
              resetTimers={resetTimers}
              startRecording={startRecording}
              stopRecording={stopRecording}
              setIsListening={setIsListening}
              setTextOpacity={setTextOpacity}
              onNext={() => {}} // 자막 설정으로 자동 이동됨 (useEffect)
            />
          )}

          {stepIndex === 2 && (
              <Step2 textOpacity={textOpacity} onNext={() => setStepIndex(3)} />
          )}

          {stepIndex === 3 && (
              <Step3 textOpacity={textOpacity} onNext={() => setStepIndex(4)} />
          )}

          {stepIndex === 4 && (
            <Step1
              textOpacity={textOpacity}
              isListening={isListening}
              isLocalSpeaking={isLocalSpeaking}
              isAiSpeaking={chatState.isAiSpeaking}
              isUserSpeaking={chatState.isUserSpeaking}
              hasError={hasError}
              phase="conversation"
              showInactivityMessage={showInactivityMessage}
              showNotUnderstood={showNotUnderstood}
              resetTimers={resetTimers}
              startRecording={startRecording}
              stopRecording={stopRecording}
              setIsListening={setIsListening}
              setTextOpacity={setTextOpacity}
              onNext={() => {}}
            />
          )}
        </FullLayout>

        {/* 디버깅용 이벤트 상태 표시 */}
        <div className="fixed bottom-4 left-4 right-4 flex justify-center pointer-events-none z-50">
          <div className="bg-black/70 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-md flex gap-3 items-center">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${chatState.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{chatState.isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
            {chatState.lastEvent && (
              <div className="border-l border-white/20 pl-3">
                LAST EVENT: <span className="text-yellow-400 font-mono">{chatState.lastEvent.toUpperCase()}</span>
              </div>
            )}
            {chatState.isAiSpeaking && (
              <div className="border-l border-white/20 pl-3 text-blue-400 animate-pulse">
                AI SPEAKING...
              </div>
            )}
          </div>
        </div>

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
