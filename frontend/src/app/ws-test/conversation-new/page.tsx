"use client";

import { useEffect, useRef, useState } from "react";
import { useConversationChatNew } from "@/features/chat/hook/useConversationChatNew";
import { tokenStorage } from "@/features/auth";

interface ChatSession {
  session_id: string;
  title: string;
  started_at: string;
  message_count: number;
}

export default function ConversationTestPage() {
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [jsonInput, setJsonInput] = useState(JSON.stringify({
    type: "session.update",
    config: {
      voice: "alloy"
    }
  }, null, 2));
  
  const { state, connect, disconnect, initAudio, sendAudio, sendText, toggleMute, sendJson } = useConversationChatNew(sessionId);
  
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 세션 목록 가져오기
  const fetchSessions = async () => {
    const token = tokenStorage.get();
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoadingSessions(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://49.50.137.35:8080";
      const response = await fetch(`${apiUrl}/api/v1/chat/sessions?skip=0&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items || [];
      setSessions(items);
    } catch (e) {
      console.error(e);
      alert("세션 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000 } });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = audioContextRef.current || new AudioContextClass({ sampleRate: 24000 });
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
        audioContextRef.current.close().catch(e => console.warn(e));
      }
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">대화하기 테스트 (Conversation Chat)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* 1. Connection & Status */}
        <div className="space-y-4">
          <div className="p-4 border rounded bg-gray-50 h-full">
            <h2 className="font-bold mb-3 text-gray-800 border-b pb-2">1. 연결 및 상태</h2>
            
            {/* Session Select */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">세션 선택</span>
                <button onClick={fetchSessions} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300" disabled={loadingSessions}>새로고침</button>
              </div>
              <select 
                value={sessionId} 
                onChange={(e) => !state.isConnected && setSessionId(e.target.value)}
                className="w-full p-2 border rounded text-sm mb-2"
                disabled={state.isConnected}
              >
                <option value="">세션을 선택하세요</option>
                {sessions.map(s => (
                  <option key={s.session_id} value={s.session_id}>
                    {s.title || s.session_id.slice(0, 8)} ({new Date(s.started_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <input type="text" value={sessionId} readOnly className="w-full p-2 border rounded bg-gray-100 text-xs text-gray-500" placeholder="Session ID" />
            </div>

            {/* Connection Controls */}
            <div className="flex flex-col gap-2 mb-4">
              <button 
                onClick={handleConnectAndStart} 
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50"
                disabled={state.isConnected || !sessionId}
              >
                연결 및 마이크 시작
              </button>
              <button 
                onClick={handleDisconnect} 
                className="w-full px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 disabled:opacity-50"
                disabled={!state.isConnected}
              >
                연결 종료
              </button>
            </div>

            {/* Mic Controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={isRecording ? stopMic : startMic}
                className={`flex-1 px-3 py-2 rounded text-sm text-white ${isRecording ? "bg-red-500" : "bg-blue-500"}`}
                disabled={!state.isConnected}
              >
                {isRecording ? "마이크 끄기" : "마이크 켜기"}
              </button>
              <button
                onClick={handleToggleMute}
                className={`flex-1 px-3 py-2 rounded text-sm text-white ${isMuted ? "bg-orange-500" : "bg-gray-500"}`}
                disabled={!state.isConnected}
              >
                {isMuted ? "음소거 해제" : "음소거"}
              </button>
            </div>

            {/* Status Display */}
            <div className="bg-white p-3 rounded border text-sm space-y-1">
              <div className="flex justify-between"><span>연결:</span> <span className={state.isConnected ? "text-green-600 font-bold" : "text-red-500"}>{state.isConnected ? "Connected" : "Disconnected"}</span></div>
              <div className="flex justify-between"><span>준비:</span> <span>{state.isReady ? "✅" : "❌"}</span></div>
              <div className="flex justify-between"><span>AI:</span> <span className={state.isAiSpeaking ? "text-blue-600 font-bold animate-pulse" : "text-gray-400"}>{state.isAiSpeaking ? "🔊 Speaking" : "Silent"}</span></div>
              <div className="flex justify-between"><span>User:</span> <span className={state.isUserSpeaking ? "text-green-600 font-bold animate-pulse" : "text-gray-400"}>{state.isUserSpeaking ? "🎤 Speaking" : "Silent"}</span></div>
            </div>
          </div>
        </div>

        {/* 2. JSON Message (Manual) */}
        <div className="space-y-4">
          <div className="p-4 border rounded bg-blue-50 border-blue-200 h-full">
            <h2 className="font-bold mb-3 text-blue-800 border-b border-blue-200 pb-2">2. JSON 메시지 전송</h2>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-48 p-2 border rounded text-xs font-mono mb-2"
              placeholder='{"type": "session.update", ...}'
            />
            <button
              onClick={handleSendJson}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
              disabled={!state.isConnected}
            >
              JSON 전송
            </button>
          </div>
        </div>

        {/* 3. Actions (Text) */}
        <div className="space-y-4">
          <div className="p-4 border rounded bg-purple-50 border-purple-200 h-full">
            <h2 className="font-bold mb-3 text-purple-800 border-b border-purple-200 pb-2">3. 텍스트 전송</h2>
            
            <div className="space-y-4">
              <div className="border-t border-purple-200 pt-4">
                <label className="block text-xs font-medium mb-1 text-gray-600">텍스트 입력 (User Input)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="메시지 입력..."
                    className="flex-1 p-2 border rounded text-sm"
                    disabled={!state.isConnected}
                  />
                  <button 
                    onClick={handleSendText}
                    className="px-3 py-2 bg-indigo-600 text-white rounded text-sm disabled:opacity-50"
                    disabled={!state.isConnected}
                  >
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Area: Messages */}
      <div className="mb-6 p-4 border rounded bg-white shadow-sm">
        <h2 className="font-bold mb-2 text-gray-700">최근 메시지 (Transcript)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 block mb-1">AI (영어)</span>
            <div className="bg-blue-50 p-3 rounded text-gray-800 text-sm min-h-[60px]">{state.aiMessage || "-"}</div>
          </div>
          <div>
            <span className="text-xs font-bold text-purple-600 block mb-1">AI (한국어)</span>
            <div className="bg-purple-50 p-3 rounded text-gray-800 text-sm min-h-[60px]">{state.aiMessageKR || "-"}</div>
          </div>
          <div>
            <span className="text-xs font-bold text-green-600 block mb-1">User</span>
            <div className="bg-green-50 p-3 rounded text-gray-800 text-sm min-h-[60px]">{state.userTranscript || "-"}</div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Logs */}
      <div className="border rounded-lg bg-black text-green-400 p-4 h-[400px] overflow-y-auto font-mono text-xs shadow-inner">
        <div className="mb-2 border-b border-gray-700 pb-1 font-bold text-gray-400 sticky top-0 bg-black">실시간 로그 (Real-time Logs)</div>
        {state.logs.length === 0 ? (
          <div className="text-gray-500 italic">이벤트를 기다리는 중...</div>
        ) : (
          state.logs.map((log, i) => (
            <div key={i} className="hover:bg-gray-900 px-1 rounded break-all py-0.5">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
