"use client";

import { useEffect, useRef, useState } from "react";
import { useScenarioChatNew } from "@/features/chat/hook/useScenarioChatNew";

export default function ScenarioTestPage() {
  const { state, connect, disconnect, initAudio, sendAudio, sendText, forceResponseCreate, sendMockAudio, toggleMute } = useScenarioChatNew();
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000 } });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        sendAudio(inputData);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsRecording(true);
    } catch (e) {
      console.error("Mic Error:", e);
      alert("마이크 시작 실패: " + e);
    }
  };

  const stopMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  const handleConnectAndStart = async () => {
    initAudio(); // 오디오 재생 준비
    connect();   // 소켓 연결
    await startMic(); // 마이크 시작 (자동)
  };

  const handleDisconnect = () => {
    disconnect();
    stopMic();
  };

  const handleSendText = () => {
    if (!textInput.trim()) return;
    sendText(textInput);
    setTextInput("");
  };

  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    toggleMute(newMuteState);
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log("Cleaning up resources...");
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">주제 정하기 테스트 (Scenario Chat)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="font-bold mb-2">연결 및 제어</h2>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleConnectAndStart} 
                className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                disabled={state.isConnected}
              >
                1. 연결 및 오디오 초기화
              </button>
              
              <button 
                onClick={handleDisconnect} 
                className="w-full px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                disabled={!state.isConnected}
              >
                연결 종료
              </button>

              <div className="flex gap-2">
                <button
                  onClick={isRecording ? stopMic : startMic}
                  className={`flex-1 px-4 py-2 rounded text-white ${isRecording ? "bg-red-600" : "bg-green-600"}`}
                  disabled={!state.isConnected}
                >
                  {isRecording ? "마이크 끄기" : "마이크 켜기"}
                </button>
                <button
                  onClick={handleToggleMute}
                  className={`flex-1 px-4 py-2 rounded text-white ${isMuted ? "bg-orange-500" : "bg-gray-500"}`}
                  disabled={!state.isConnected}
                >
                  {isMuted ? "음소거 해제" : "음소거"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded bg-gray-50">
             <h2 className="font-bold mb-2">수동 이벤트 (테스트용)</h2>
             <div className="flex flex-col gap-2">
                <button 
                  onClick={forceResponseCreate}
                  className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  응답 생성 요청 (Force Response)
                </button>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="텍스트 입력..."
                    className="flex-1 p-2 border rounded text-sm"
                    disabled={!state.isConnected}
                  />
                  <button 
                    onClick={handleSendText}
                    className="px-3 py-2 bg-indigo-500 text-white rounded text-sm disabled:opacity-50"
                    disabled={!state.isConnected}
                  >
                    전송
                  </button>
                </div>

                <button 
                  onClick={sendMockAudio}
                  className="w-full px-3 py-2 bg-gray-500 text-white rounded text-sm disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  가상 오디오 전송 (무음)
                </button>
             </div>
          </div>

          {/* Scenario Result Panel */}
          <div className="p-4 border rounded bg-green-50 border-green-200">
            <h2 className="font-bold mb-2 text-green-800">시나리오 결과</h2>
            {state.scenarioResult ? (
              <div className="text-sm space-y-1">
                <div><span className="font-semibold">장소:</span> {state.scenarioResult.place || "-"}</div>
                <div><span className="font-semibold">상대:</span> {state.scenarioResult.conversation_partner || "-"}</div>
                <div><span className="font-semibold">목표:</span> {state.scenarioResult.conversation_goal || "-"}</div>
                <div><span className="font-semibold">세션ID:</span> {state.scenarioResult.sessionId || "-"}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">결과 대기 중...</div>
            )}
          </div>
        </div>

        {/* Right: Logs & Status */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded bg-white shadow-sm">
              <h2 className="font-bold mb-2 text-gray-700">상태 (Status)</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>연결 상태:</span>
                  <span className={state.isConnected ? "text-green-600 font-bold" : "text-red-500"}>
                    {state.isConnected ? "연결됨" : "연결 끊김"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>준비 완료:</span>
                  <span>{state.isReady ? "✅" : "❌"}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI 발화 중:</span>
                  <span className={state.isAiSpeaking ? "text-blue-600 font-bold animate-pulse" : "text-gray-400"}>
                    {state.isAiSpeaking ? "🔊 말하는 중" : "조용함"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>사용자 발화 중:</span>
                  <span className={state.isUserSpeaking ? "text-green-600 font-bold animate-pulse" : "text-gray-400"}>
                    {state.isUserSpeaking ? "🎤 말하는 중" : "조용함"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>마이크 상태:</span>
                  <span className={isRecording ? "text-red-600 font-bold animate-pulse" : "text-gray-400"}>
                    {isRecording ? "🔴 녹음 중" : "꺼짐"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>음소거:</span>
                  <span className={isMuted ? "text-orange-600 font-bold" : "text-gray-400"}>
                    {isMuted ? "🔇 켜짐" : "🔊 꺼짐"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded bg-white shadow-sm">
              <h2 className="font-bold mb-2 text-gray-700">최근 메시지</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs font-bold text-blue-600 block">AI (Transcript):</span>
                  <p className="bg-blue-50 p-1 rounded text-gray-800 min-h-[20px]">{state.aiMessage || "-"}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-600 block">AI (Korean):</span>
                  <p className="bg-purple-50 p-1 rounded text-gray-800 min-h-[20px]">{state.aiMessageKR || "-"}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-green-600 block">User (Transcript):</span>
                  <p className="bg-green-50 p-1 rounded text-gray-800 min-h-[20px]">{state.userTranscript || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg bg-black text-green-400 p-4 h-[500px] overflow-y-auto font-mono text-xs shadow-inner">
            <div className="mb-2 border-b border-gray-700 pb-1 font-bold text-gray-400">실시간 로그</div>
            {state.logs.length === 0 ? (
              <div className="text-gray-500 italic">이벤트를 기다리는 중...</div>
            ) : (
              state.logs.map((log, i) => (
                <div key={i} className="hover:bg-gray-900 px-1 rounded">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
