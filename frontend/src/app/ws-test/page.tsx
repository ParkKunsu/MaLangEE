"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/ui";
import { useGeneralChat } from "@/features/chat";

export default function WebSocketTestPage() {
  const [sessionId, setSessionId] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [voice, setVoice] = useState("alloy");
  const [showText, setShowText] = useState(true);
  const [mode, setMode] = useState<"general" | "scenario">("general");
  const [isConnected, setIsConnected] = useState(false);

  const {
    state,
    connect,
    disconnect,
    sendText,
    sendAudioChunk,
    initAudio,
    toggleMute,
    togglePause,
  } = useGeneralChat({
    mode,
    sessionId,
    voice,
    showText,
    autoConnect: false, // 수동 연결
  });

  // 로그 추가 함수
  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // 상태 변경 감지 및 로그 출력
  useEffect(() => {
    if (state.isConnected !== isConnected) {
      setIsConnected(state.isConnected);
      addLog(`Connection Status: ${state.isConnected ? "Connected" : "Disconnected"}`);
    }
    if (state.error) addLog(`Error: ${state.error}`);
    if (state.lastEvent) addLog(`Event Received: ${state.lastEvent}`);
    if (state.aiMessage) addLog(`AI Message: ${state.aiMessage}`);
    if (state.userTranscript) addLog(`User Transcript: ${state.userTranscript}`);
    if (state.isAiSpeaking) addLog(`AI Speaking: ${state.isAiSpeaking}`);
    if (state.isUserSpeaking) addLog(`User Speaking: ${state.isUserSpeaking}`);
  }, [state, isConnected]);

  const handleConnect = () => {
    if (!sessionId && mode === "general") {
      const newId = crypto.randomUUID();
      setSessionId(newId);
      addLog(`Generated Session ID: ${newId}`);
    }
    addLog("Connecting...");
    connect();
  };

  const handleDisconnect = () => {
    addLog("Disconnecting...");
    disconnect();
  };

  const handleSendText = () => {
    const text = prompt("Enter text to send:");
    if (text) {
      sendText(text);
      addLog(`Sent Text: ${text}`);
    }
  };

  // 가상의 오디오 데이터 전송 (테스트용)
  const handleSendMockAudio = () => {
    addLog("Sending mock audio chunk...");
    const mockData = new Float32Array(4096).fill(0); // Silence
    sendAudioChunk(mockData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket Test Console</h1>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h2 className="font-semibold">Configuration</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">Mode</label>
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value as "general" | "scenario")}
              className="w-full p-2 border rounded"
              disabled={isConnected}
            >
              <option value="general">General Chat</option>
              <option value="scenario">Scenario Chat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Session ID</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Auto-generated if empty"
              className="w-full p-2 border rounded"
              disabled={isConnected}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Voice</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isConnected}
              >
                <option value="alloy">Alloy</option>
                <option value="echo">Echo</option>
                <option value="shimmer">Shimmer</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showText}
                  onChange={(e) => setShowText(e.target.checked)}
                  disabled={isConnected}
                />
                <span>Show Text</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleConnect} 
              disabled={isConnected}
              variant="primary"
              fullWidth
            >
              Connect
            </Button>
            <Button 
              onClick={handleDisconnect} 
              disabled={!isConnected}
              variant="outline"
              fullWidth
            >
              Disconnect
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h2 className="font-semibold">Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => initAudio()} disabled={!isConnected} variant="secondary">
              Init Audio
            </Button>
            <Button onClick={handleSendText} disabled={!isConnected} variant="secondary">
              Send Text
            </Button>
            <Button onClick={handleSendMockAudio} disabled={!isConnected} variant="secondary">
              Send Mock Audio
            </Button>
            <Button onClick={() => toggleMute(true)} disabled={!isConnected} variant="secondary">
              Mute
            </Button>
            <Button onClick={() => toggleMute(false)} disabled={!isConnected} variant="secondary">
              Unmute
            </Button>
            <Button onClick={() => togglePause(true)} disabled={!isConnected} variant="secondary">
              Pause
            </Button>
            <Button onClick={() => togglePause(false)} disabled={!isConnected} variant="secondary">
              Resume
            </Button>
          </div>
          
          <div className="mt-4 p-2 bg-white rounded border">
            <h3 className="text-sm font-medium mb-2">Current State</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span>Connected:</span>
              <span className={state.isConnected ? "text-green-600 font-bold" : "text-red-600"}>
                {state.isConnected ? "Yes" : "No"}
              </span>
              <span>Ready:</span>
              <span>{state.isReady ? "Yes" : "No"}</span>
              <span>AI Speaking:</span>
              <span className={state.isAiSpeaking ? "text-blue-600 font-bold" : ""}>
                {state.isAiSpeaking ? "Yes" : "No"}
              </span>
              <span>User Speaking:</span>
              <span className={state.isUserSpeaking ? "text-green-600 font-bold" : ""}>
                {state.isUserSpeaking ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="border rounded-lg bg-black text-green-400 p-4 font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">Waiting for events...</div>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
    </div>
  );
}
