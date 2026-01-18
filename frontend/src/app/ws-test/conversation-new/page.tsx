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
  
  const { state, connect, disconnect, initAudio, sendAudio, sendText } = useConversationChatNew(sessionId);
  
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 세션 목록 가져오기
  const fetchSessions = async () => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

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
      // API 응답 구조에 따라 처리 (배열 또는 { items: [] })
      const items = Array.isArray(data) ? data : data.items || [];
      setSessions(items);
    } catch (e) {
      console.error(e);
      alert("세션 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingSessions(false);
    }
  };

  // 초기 로드 시 세션 목록 조회
  useEffect(() => {
    fetchSessions();
  }, []);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000 } });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      // 기존 컨텍스트가 있으면 재사용 (initAudio에서 생성된 것)
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
    streamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    // audioContext는 닫지 않음 (재생을 위해 유지)
    setIsRecording(false);
  };

  const handleConnectAndStart = async () => {
    initAudio(); // 오디오 재생 준비
    connect();   // 소켓 연결
    await startMic(); // 마이크 시작
  };

  const handleDisconnect = () => {
    disconnect();
    stopMic();
  };

  const handleSendText = () => {
    const text = prompt("전송할 텍스트를 입력하세요:");
    if (text) sendText(text);
  };

  // 컴포넌트 언마운트 시 정리 (새로고침, 페이지 이동 등)
  useEffect(() => {
    return () => {
      console.log("Cleaning up resources...");
      // 1. 마이크 스트림 정지
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      // 2. 오디오 프로세서 연결 해제
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      // 3. 오디오 컨텍스트 종료
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // 4. 소켓 연결 해제 (훅 내부에서도 처리하지만 명시적으로 호출)
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">대화하기 테스트 (Conversation Chat)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Session Control */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 border rounded bg-gray-50">
            <h2 className="font-bold mb-2">세션 관리</h2>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={fetchSessions} 
                className="w-full px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                disabled={loadingSessions}
              >
                목록 새로고침
              </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {sessions.map((s) => (
                <div 
                  key={s.session_id}
                  onClick={() => !state.isConnected && setSessionId(s.session_id)}
                  className={`p-2 border rounded cursor-pointer text-sm ${
                    sessionId === s.session_id ? "border-blue-500 bg-blue-50" : "hover:bg-white"
                  } ${state.isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="font-medium truncate">{s.title || "제목 없음"}</div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{new Date(s.started_at).toLocaleDateString()}</span>
                    <span>{s.message_count} msgs</span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">{s.session_id}</div>
                </div>
              ))}
              {sessions.length === 0 && !loadingSessions && (
                <div className="text-center text-gray-500 text-sm py-4">세션이 없습니다.</div>
              )}
            </div>
          </div>

          <div className="p-4 border rounded bg-gray-50">
             <h2 className="font-bold mb-2">선택된 세션</h2>
             <input 
                type="text" 
                value={sessionId} 
                readOnly
                className="w-full p-2 border rounded bg-gray-100 text-xs mb-2"
                placeholder="목록에서 세션을 선택하세요"
              />
             <div className="flex flex-col gap-2">
                <button 
                  onClick={handleConnectAndStart} 
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                  disabled={state.isConnected || !sessionId}
                >
                  1. 연결 및 마이크 시작
                </button>
                
                <button 
                  onClick={handleDisconnect} 
                  className="w-full px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  연결 종료
                </button>

                <button
                  onClick={isRecording ? stopMic : startMic}
                  className={`w-full px-4 py-2 rounded text-white ${isRecording ? "bg-red-600" : "bg-green-600"}`}
                  disabled={!state.isConnected}
                >
                  {isRecording ? "마이크 끄기" : "마이크 켜기"}
                </button>
                
                <button 
                  onClick={handleSendText}
                  className="w-full px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  텍스트 전송
                </button>
             </div>
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
