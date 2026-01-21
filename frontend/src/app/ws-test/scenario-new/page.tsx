"use client";

import { useEffect, useState } from "react";
import { useScenarioChatNew } from "@/features/chat/hook/useScenarioChatNew";

export default function ScenarioTestPage() {
  const {
    state, connect, disconnect, initAudio, startMicrophone, stopMicrophone,
    sendText, toggleMute, clearAudioBuffer, commitAudio
  } = useScenarioChatNew();

  const [textInput, setTextInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const handleConnectAndStart = async () => {
    try {
      console.log("🔧 [DEBUG] Starting connection process...");
      console.log("🔧 [DEBUG] Initializing audio...");
      initAudio();
      console.log("🔧 [DEBUG] Audio initialized, connecting to WebSocket...");
      connect();
      console.log("🔧 [DEBUG] Connect function called");
    } catch (error) {
      console.error("❌ [ERROR] Connection failed:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
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
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] p-8">
      <h1 className="mb-6 text-2xl font-bold">주제 정하기 테스트 (Scenario Chat)</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                onClick={state.isRecording ? stopMicrophone : startMicrophone}
                className={`flex-1 rounded px-3 py-2 text-sm text-white ${state.isRecording ? "bg-red-500" : "bg-green-600"}`}
                disabled={!state.isConnected}
              >
                {state.isRecording ? "마이크 끄기" : "마이크 켜기"}
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
                <span>AI 발화:</span>{" "}
                <span
                  className={
                    state.isAiSpeaking ? "animate-pulse font-bold text-blue-600" : "text-gray-400"
                  }
                >
                  {state.isAiSpeaking ? "🔊 Speaking" : "Silent"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>마이크:</span>{" "}
                <span className={state.isRecording ? "font-bold text-green-600" : "text-gray-400"}>
                  {state.isRecording ? "🎤 Recording" : "Off"}
                </span>
              </div>
            </div>

            {/* Scenario Result */}
            <div className="mt-4 rounded border border-green-200 bg-green-50 p-3">
              <h3 className="mb-2 text-xs font-bold text-green-800">✅ 시나리오 결과</h3>
              {state.scenarioResult ? (
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-semibold">장소:</span> {state.scenarioResult.place || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">상대:</span>{" "}
                    {state.scenarioResult.conversationPartner || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">목표:</span>{" "}
                    {state.scenarioResult.conversationGoal || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">세션ID:</span>{" "}
                    {state.scenarioResult.sessionId || "-"}
                  </div>
                  <div className="mt-2 border-t border-green-300 pt-2 text-xs italic text-green-700">
                    💾 시나리오가 DB에 자동 저장되었습니다
                  </div>
                </div>
              ) : (
                <div className="text-xs italic text-gray-500">결과 대기 중...</div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Actions (Text & Manual) */}
        <div className="space-y-4">
          <div className="h-full rounded border border-purple-200 bg-purple-50 p-4">
            <h2 className="mb-3 border-b border-purple-200 pb-2 font-bold text-purple-800">
              2. 액션 및 응답 (Response)
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

              <div className="border-t border-purple-200 pt-4">
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  오디오 컨트롤
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={clearAudioBuffer}
                    className="flex-1 rounded bg-yellow-500 px-3 py-2 text-xs text-white disabled:opacity-50"
                    disabled={!state.isConnected}
                  >
                    버퍼 초기화 (Clear)
                  </button>
                  <button
                    onClick={commitAudio}
                    className="flex-1 rounded bg-green-500 px-3 py-2 text-xs text-white disabled:opacity-50"
                    disabled={!state.isConnected}
                  >
                    발화 종료 (Commit)
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  ※ Server VAD 모드에서는 일반적으로 불필요
                </p>
              </div>

              <div className="border-t border-purple-200 pt-4">
                <h3 className="mb-2 text-sm font-bold text-purple-900">📋 사용 가이드</h3>
                <div className="space-y-1 text-xs text-gray-700">
                  <div>
                    <strong className="text-purple-700">1. 연결:</strong> &ldquo;연결 및 오디오 초기화&rdquo; 클릭
                  </div>
                  <div className="ml-4 text-gray-600">
                    ➜ 서버가 자동으로 AI 첫 인사를 시작합니다
                  </div>
                  <div>
                    <strong className="text-purple-700">2. AI 인사:</strong> 말랭이가 먼저 시나리오 정보를 물음
                  </div>
                  <div>
                    <strong className="text-purple-700">3. 대화:</strong> 장소(place), 상대(partner), 목표(goal)를 말하기
                  </div>
                  <div className="ml-4 text-gray-600">
                    ➜ 한 번에 모두 말해도 되고, AI 질문에 순차적으로 답변해도 됩니다
                  </div>
                  <div>
                    <strong className="text-purple-700">4. 완료:</strong> 3가지 정보가 모두 추출되면 시나리오 자동 생성
                  </div>
                  <div className="ml-4 text-gray-600">
                    ➜ DB에 자동 저장되며 sessionId를 반환합니다
                  </div>
                  <div className="mt-2 rounded bg-purple-100 p-2 text-xs italic text-purple-800">
                    💡 <strong>Tip:</strong> 텍스트 입력 기능으로 빠른 테스트도 가능합니다
                  </div>
                </div>
              </div>
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
