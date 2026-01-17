"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MicButton, Button, MalangEE } from "@/shared/ui";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { useScenarioChat } from "@/features/chat";
import "@/shared/styles/scenario.css";

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
  const { state: chatState, connect, disconnect, sendAudioChunk, initAudio } = useScenarioChat();
  
  const [currentState, setCurrentState] = useState<ScenarioState>(0);
  const [isListening, setIsListening] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [showWaitPopup, setShowWaitPopup] = useState(false);
  const [showEndChatPopup, setShowEndChatPopup] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // WebSocket 연결
  useEffect(() => {
    connect();
    return () => {
      disconnect();
      stopRecording();
    };
  }, [connect, disconnect]);

  // 사용자가 메시지를 보낸 시점(발화 텍스트 수신 시점)부터 15초 타이머 시작
  useEffect(() => {
    if (chatState.userTranscript) {
      resetTimers();
      startInactivityTimer();
    }
  }, [chatState.userTranscript]);

  // 시나리오 완료 시 처리
  useEffect(() => {
    if (chatState.isCompleted) {
      resetTimers();
      setCurrentState(3);
      setIsListening(false);
      setTimeout(() => {
        setShowLoginPopup(true);
      }, 1500);
    }
  }, [chatState.isCompleted]);

  // 비활동 타이머 시작 (사용자 발화 후 15초)
  const startInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityMessage(true);
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
      stopRecording();
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

  // 사용자 활동 시작 (타이머 초기화)
  const resetTimers = () => {
    clearInactivityTimer();
    clearWaitTimer();
    setShowInactivityMessage(false);
  };

  // 마이크 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        sendAudioChunk(new Float32Array(inputData));
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error("Mic error:", error);
      setIsListening(false);
      setCurrentState(2);
    }
  };

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleMicClick = () => {
    if (currentState === 3) return;
    initAudio();
    resetTimers();
    setTextOpacity(0);

    setTimeout(() => {
      if (!isListening) {
        setCurrentState(1);
        setIsListening(true);
        startRecording();
      } else {
        setIsListening(false);
        stopRecording();
        // 수동으로 마이크를 껐을 때도 타이머 시작 (서버 응답 대기)
        startInactivityTimer();
      }
      setTextOpacity(1);
    }, 300);
  };

  const getMainTitle = () => {
    if (showInactivityMessage) return "말랭이가 대답을 기다리고 있어요.";

    switch (currentState) {
      case 0: return "어떤 상황을 연습하고 싶은지\n편하게 말해보세요.";
      case 1: return "장소나 상황 또는 키워드로\n말씀해 주세요.";
      case 2: return "말랭이가 잘 이해하지 못했어요.";
      case 3: return "좋아요! 상황을 파악했어요.\n잠시만 기다려주세요.";
      default: return "";
    }
  };

  const getSubDesc = () => {
    if (showInactivityMessage) return "Cheer up!";

    switch (currentState) {
      case 0: return "마이크를 누르면 바로 시작돼요";
      case 1: return "다 듣고 나면 마이크를 다시 눌러주세요";
      case 2: return "다시 한번 말씀해 주시겠어요?";
      case 3: return "곧 연습을 시작할게요!";
      default: return "";
    }
  };

  const handleStopChat = () => router.push("/auth/signup");
  const handleLogin = () => router.push("/auth/login");
  const handleContinueChat = () => {
    setShowWaitPopup(false);
    resetTimers();
    startInactivityTimer();
  };
  const handleStopFromWait = () => router.push("/auth/signup");
  const handleContinueFromEnd = () => {
    setShowEndChatPopup(false);
    resetTimers();
    startInactivityTimer();
  };
  const handleStopFromEnd = () => router.push("/auth/signup");

  return (
    <>
      <div className="character-box">
        <MalangEE status={showInactivityMessage ? "humm" : chatState.isAiSpeaking ? "talking" : "default"} size={150} />
      </div>

      <div className="text-group text-center" style={{ opacity: textOpacity }}>
        <h1 className="scenario-title whitespace-pre-line">{getMainTitle()}</h1>
        <p className="scenario-desc text-sm text-text-secondary mt-2">{getSubDesc()}</p>
      </div>

      <div className="relative mt-6 flex flex-col items-center">
        {/* 자막 말풍선 (마이크 위쪽) */}
        {(chatState.aiMessage || chatState.userTranscript) && (
          <div className="absolute bottom-full mb-6 w-full max-w-[320px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/60 text-center">
              {/* 말풍선 꼬리 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-r border-b border-white/60" />
              
              {chatState.userTranscript && (
                <p className="text-xs text-text-secondary mb-2 italic">나: {chatState.userTranscript}</p>
              )}
              {chatState.aiMessage && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm text-text-primary leading-relaxed font-semibold">
                    {chatState.aiMessage}
                  </p>
                  {chatState.aiMessageKR && (
                    <p className="text-[11px] text-brand font-medium leading-tight">
                      {chatState.aiMessageKR}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <MicButton
          isListening={isListening}
          onClick={handleMicClick}
          size="md"
          className={currentState === 3 ? "pointer-events-none opacity-50" : ""}
        />
      </div>

      {/* 디버깅용 이벤트 상태 표시 */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center pointer-events-none">
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

      {/* Popups (Login, Wait, End) - 기존과 동일 */}
      {showLoginPopup && (
        <PopupLayout onClose={() => setShowLoginPopup(false)} maxWidth="md" showCloseButton={false}>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800 leading-relaxed">
                로그인을 하면 대화를 저장하고
                <br />
                이어 말할 수 있어요
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button onClick={handleStopChat} variant="outline" className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50">
                대화 그만하기
              </Button>
              <Button variant="primary" size="xl" onClick={handleLogin} className="flex-1">
                로그인하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}

      {showWaitPopup && (
        <PopupLayout onClose={() => setShowWaitPopup(false)} maxWidth="md" showCloseButton={false}>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800 leading-relaxed">
                대화가 잠시 멈췄어요.
                <br />
                계속 이야기 할까요?
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button onClick={handleStopFromWait} variant="outline" className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50">
                대화 그만하기
              </Button>
              <Button variant="primary" size="xl" onClick={handleContinueChat} className="flex-1">
                이어 말하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}

      {showEndChatPopup && (
        <PopupLayout onClose={() => setShowEndChatPopup(false)} maxWidth="md" showCloseButton={false}>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800 leading-relaxed">
                지금은 여기까지만 할까요?
                <br />
                나중에 같은 주제로 다시 대화할 수 있어요.
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button onClick={handleStopFromEnd} variant="outline" className="h-14 flex-1 rounded-full border-2 border-gray-300 text-base font-semibold text-gray-700 transition hover:bg-gray-50">
                대화 그만하기
              </Button>
              <Button variant="primary" size="xl" onClick={handleContinueFromEnd} className="flex-1">
                이어 말하기
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
