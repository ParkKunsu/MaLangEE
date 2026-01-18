"use client";

import { useEffect, useRef, useState } from "react";
import { useScenarioChatNew } from "@/features/chat/hook/useScenarioChatNew";

export default function ScenarioTestPage() {
  const [voice, setVoice] = useState("alloy");
  const { 
    state, connect, disconnect, initAudio, sendAudio, sendText, 
    forceResponseCreate, sendMockAudio, toggleMute,
    clearAudioBuffer, commitAudio, updateSession, sendJson 
  } = useScenarioChatNew(voice);
  
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [jsonInput, setJsonInput] = useState(JSON.stringify({
    type: "session.update",
    config: {
      instructions: "You are a scenario selector. Ask the user what situation they want to practice."
    }
  }, null, 2));
  
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
    initAudio();
    connect();
    await startMic();
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

  const handleSendJson = () => {
    try {
      const json = JSON.parse(jsonInput);
      sendJson(json);
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="mx-auto max-w-[1600px] p-8">
      <h1 className="mb-6 text-2xl font-bold">주제 정하기 테스트 (Scenario Chat)</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Connection & Status */}
        <div className="space-y-4">
          <div className="h-full rounded border bg-gray-50 p-4">
            <h2 className="mb-3 border-b pb-2 font-bold text-gray-800">1. 연결 및 상태</h2>

            <div className="mb-4 flex flex-col gap-2">
              <button
                onClick={handleConnectAndStart}
                className="w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                disabled={state.isConnected}
              >
                1. 연결 및 오디오 초기화
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                disabled={!state.isConnected}
              >
                연결 종료
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={isRecording ? stopMic : startMic}
                className={`flex-1 rounded px-3 py-2 text-sm text-white ${isRecording ? "bg-red-500" : "bg-green-600"}`}
                disabled={!state.isConnected}
              >
                {isRecording ? "마이크 끄기" : "마이크 켜기"}
              </button>
              <button
                onClick={handleToggleMute}
                className={`flex-1 rounded px-3 py-2 text-sm text-white ${isMuted ? "bg-orange-500" : "bg-gray-500"}`}
                disabled={!state.isConnected}
              >
                {isMuted ? "음소거 해제" : "음소거"}
              </button>
            </div>

            <div className="space-y-1 rounded border bg-white p-3 text-sm">
              <div className="flex justify-between">
                <span>연결:</span>{" "}
                <span className={state.isConnected ? "font-bold text-green-600" : "text-red-500"}>
                  {state.isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>준비:</span> <span>{state.isReady ? "✅" : "❌"}</span>
              </div>
              <div className="flex justify-between">
                <span>AI:</span>{" "}
                <span
                  className={
                    state.isAiSpeaking ? "animate-pulse font-bold text-blue-600" : "text-gray-400"
                  }
                >
                  {state.isAiSpeaking ? "🔊 Speaking" : "Silent"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>{" "}
                <span
                  className={
                    state.isUserSpeaking
                      ? "animate-pulse font-bold text-green-600"
                      : "text-gray-400"
                  }
                >
                  {state.isUserSpeaking ? "🎤 Speaking" : "Silent"}
                </span>
              </div>
            </div>

            {/* Scenario Result */}
            <div className="mt-4 rounded border border-green-200 bg-green-50 p-3">
              <h3 className="mb-2 text-xs font-bold text-green-800">시나리오 결과</h3>
              {state.scenarioResult ? (
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-semibold">장소:</span> {state.scenarioResult.place || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">상대:</span>{" "}
                    {state.scenarioResult.conversation_partner || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">목표:</span>{" "}
                    {state.scenarioResult.conversation_goal || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">세션ID:</span>{" "}
                    {state.scenarioResult.sessionId || "-"}
                  </div>
                </div>
              ) : (
                <div className="text-xs italic text-gray-500">결과 대기 중...</div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Settings (Session Update) */}
        <div className="space-y-4">
          <div className="h-full rounded border border-blue-200 bg-blue-50 p-4">
            <h2 className="mb-3 border-b border-blue-200 pb-2 font-bold text-blue-800">
              2. 세션 설정 (Session Update)
            </h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  목소리 (Voice)
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full rounded border p-2 text-sm"
                  disabled={state.isConnected}
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="shimmer">Shimmer</option>
                  <option value="ash">Ash</option>
                  <option value="ballad">Ballad</option>
                  <option value="coral">Coral</option>
                  <option value="sage">Sage</option>
                  <option value="verse">Verse</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  JSON 메시지 전송
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="mb-2 h-48 w-full rounded border p-2 font-mono text-xs"
                  placeholder='{"type": "session.update", ...}'
                />
                <button
                  onClick={handleSendJson}
                  className="w-full rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  JSON 전송
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Actions (Response Create & Text) */}
        <div className="space-y-4">
          <div className="h-full rounded border border-purple-200 bg-purple-50 p-4">
            <h2 className="mb-3 border-b border-purple-200 pb-2 font-bold text-purple-800">
              3. 액션 및 응답 (Response)
            </h2>

            <div className="space-y-4">
              <div className="border-t border-purple-200 pt-4">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  텍스트 전송 (User Input)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                    placeholder="메시지 입력..."
                    className="flex-1 rounded border p-2 text-sm"
                    disabled={!state.isConnected}
                  />
                  <button
                    onClick={handleSendText}
                    className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    disabled={!state.isConnected}
                  >
                    전송
                  </button>
                </div>
              </div>

              <div className="flex gap-2 border-t border-purple-200 pt-4">
                <button
                  onClick={sendMockAudio}
                  className="flex-1 rounded bg-gray-500 px-3 py-2 text-xs text-white disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  가상 오디오 (무음)
                </button>
                <button
                  onClick={clearAudioBuffer}
                  className="flex-1 rounded bg-yellow-500 px-3 py-2 text-xs text-white disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  버퍼 초기화
                </button>
                <button
                  onClick={commitAudio}
                  className="flex-1 rounded bg-green-500 px-3 py-2 text-xs text-white disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  발화 종료
                </button>
              </div>

              <button
                onClick={forceResponseCreate}
                className="mt-2 w-full rounded bg-purple-500 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={!state.isConnected}
              >
                응답 생성 요청 (Force Response)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Area: Messages */}
      <div className="mb-6 rounded border bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-bold text-gray-700">최근 메시지 (Transcript)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <span className="mb-1 block text-xs font-bold text-blue-600">AI (영어)</span>
            <div className="min-h-[60px] rounded bg-blue-50 p-3 text-sm text-gray-800">
              {state.aiMessage || "-"}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold text-purple-600">AI (한국어)</span>
            <div className="min-h-[60px] rounded bg-purple-50 p-3 text-sm text-gray-800">
              {state.aiMessageKR || "-"}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold text-green-600">User</span>
            <div className="min-h-[60px] rounded bg-green-50 p-3 text-sm text-gray-800">
              {state.userTranscript || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Logs */}
      <div className="h-[400px] overflow-y-auto rounded-lg border bg-black p-4 font-mono text-xs text-green-400 shadow-inner">
        <div className="sticky top-0 mb-2 border-b border-gray-700 bg-black pb-1 font-bold text-gray-400">
          실시간 로그 (Real-time Logs)
        </div>
        {state.logs.length === 0 ? (
          <div className="italic text-gray-500">이벤트를 기다리는 중...</div>
        ) : (
          state.logs.map((log, i) => (
            <div key={i} className="break-all rounded px-1 py-0.5 hover:bg-gray-900">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
