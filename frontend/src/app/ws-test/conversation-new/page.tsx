"use client";

import { useEffect, useState } from "react";
import { useConversationChatNew } from "@/features/chat/hook/useConversationChatNew";
import { useGetChatSessions } from "@/features/chat/api/use-chat-sessions";

export default function ConversationTestPage() {
  const [sessionId, setSessionId] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("alloy");

  // 공통 API 훅 사용 (Mixed Content 방지 및 일관성 유지)
  const { data: sessionsData, isLoading: loadingSessions, refetch: fetchSessions } = useGetChatSessions(0, 20);
  const sessions = sessionsData?.items || [];

  const { 
    state, 
    connect, 
    disconnect, 
    initAudio, 
    startMicrophone, 
    stopMicrophone, 
    sendText, 
    commitAudio, 
    updateVoice, 
    requestResponse, 
    toggleMute 
  } = useConversationChatNew(sessionId);

  const handleConnectAndStart = async () => {
    initAudio();
    connect();
    await startMicrophone();
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
    <div className="p-8 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">대화하기 테스트 (Conversation Chat)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* 1. Connection & Status */}
        <div className="space-y-4">
          <div className="p-4 border rounded bg-gray-50 h-full">
            <h2 className="font-bold mb-3 text-gray-800 border-b pb-2">1. 연결 및 상태</h2>

            {/* Session Select */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">세션 선택</span>
                <button 
                  onClick={() => fetchSessions()} 
                  className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300" 
                  disabled={loadingSessions}
                >
                  {loadingSessions ? "로딩 중..." : "새로고침"}
                </button>
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
              {sessionId && (
                <div className="mt-2 rounded bg-blue-50 p-2 text-xs text-blue-700">
                  ℹ️ 같은 세션으로 재연결 시 이전 대화가 자동 복원됩니다
                </div>
              )}
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
                onClick={state.isRecording ? stopMicrophone : startMicrophone}
                className={`flex-1 px-3 py-2 rounded text-sm text-white ${state.isRecording ? "bg-red-500" : "bg-blue-500"}`}
                disabled={!state.isConnected}
              >
                {state.isRecording ? "마이크 끄기" : "마이크 켜기"}
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

        {/* 2. Actions (Text & Controls) */}
        <div className="space-y-4">
          <div className="p-4 border rounded bg-purple-50 border-purple-200 h-full">
            <h2 className="font-bold mb-3 text-purple-800 border-b border-purple-200 pb-2">2. 액션 및 컨트롤</h2>

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

              <div className="border-t border-purple-200 pt-4">
                <label className="block text-xs font-medium mb-2 text-gray-600">AI 목소리 선택</label>
                <div className="flex gap-2">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="flex-1 p-2 border rounded text-sm"
                    disabled={!state.isConnected}
                  >
                    <option value="alloy">Alloy</option>
                    <option value="ash">Ash</option>
                    <option value="ballad">Ballad</option>
                    <option value="coral">Coral</option>
                    <option value="echo">Echo</option>
                    <option value="sage">Sage</option>
                    <option value="shimmer">Shimmer</option>
                    <option value="verse">Verse</option>
                  </select>
                  <button
                    onClick={() => updateVoice(selectedVoice)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                    disabled={!state.isConnected}
                  >
                    변경
                  </button>
                </div>
              </div>

              <div className="border-t border-purple-200 pt-4">
                <label className="block text-xs font-medium mb-2 text-gray-600">AI 응답 제어</label>
                <button
                  onClick={requestResponse}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  AI 응답 요청 (Response Create)
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  서버가 먼저 말하게 하거나 강제로 응답을 받을 때 사용
                </p>
              </div>

              <div className="border-t border-purple-200 pt-4">
                <label className="block text-xs font-medium mb-2 text-gray-600">오디오 컨트롤 (테스트용)</label>
                <button
                  onClick={commitAudio}
                  className="w-full px-3 py-2 bg-orange-500 text-white rounded text-xs disabled:opacity-50"
                  disabled={!state.isConnected}
                >
                  발화 종료 (Commit Audio)
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Server VAD 모드에서는 불필요 (자동 감지)
                </p>
              </div>

              <div className="border-t border-purple-200 pt-4">
                <h3 className="mb-2 text-sm font-bold text-purple-900">📋 사용 가이드</h3>
                <div className="space-y-1 text-xs text-gray-700">
                  <div>
                    <strong className="text-purple-700">1. 세션 선택:</strong> 기존 세션을 선택하거나 새로운 세션 ID 입력
                  </div>
                  <div className="ml-4 text-gray-600">
                    ➜ 같은 세션으로 재연결 시 이전 대화가 자동 복원됩니다
                  </div>
                  <div>
                    <strong className="text-purple-700">2. 연결:</strong> &ldquo;연결 및 마이크 시작&rdquo; 클릭
                  </div>
                  <div className="ml-4 text-gray-600">
                    ➜ 서버가 자동으로 AI 첫 인사를 시작합니다
                  </div>
                  <div>
                    <strong className="text-purple-700">3. 대화:</strong> AI와 자유롭게 영어 회화 연습
                  </div>
                  <div className="ml-4 text-gray-600">
                    ➜ Server VAD가 자동으로 발화 시작/종료를 감지합니다
                  </div>
                  <div>
                    <strong className="text-purple-700">4. 종료:</strong> &ldquo;연결 종료&rdquo; 클릭
                  </div>
                  <div className="ml-4 text-gray-600">
                    ➜ 세션 리포트와 피드백이 자동 생성됩니다 (메시지 10개 이상 시)
                  </div>
                  <div className="mt-2 rounded bg-purple-100 p-2 text-xs italic text-purple-800">
                    💡 <strong>Tip:</strong> AI 목소리를 실시간으로 변경할 수 있습니다
                  </div>
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
            <div className="bg-purple-50 p-3 rounded text-gray-800 text-sm min-h-[60px]">{state.aiMessageKR || "-"}</div >
          </div>
          <div>
            <span className="text-xs font-bold text-green-600 block mb-1">User</span>
            <div className="bg-green-50 p-3 rounded text-gray-800 text-sm min-h-[60px]">{state.userTranscript || "-"}</div>
          </div>
        </div>
      </div>

      {/* Session Report & Feedback */}
      {(state.sessionReport || state.feedback || state.scenarioSummary) && (
        <div className="mb-6 p-4 border rounded bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
          <h2 className="font-bold mb-4 text-gray-800 flex items-center gap-2">
            📊 세션 리포트 및 피드백
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Session Report */}
            {state.sessionReport && (
              <div className="bg-white p-4 rounded border">
                <h3 className="text-sm font-bold text-blue-700 mb-2">세션 정보</h3>
                <div className="space-y-1 text-xs">
                  <div><span className="font-semibold">세션 ID:</span> {state.sessionReport.session_id?.substring(0, 8)}...</div>
                  {state.sessionReport.started_at && <div><span className="font-semibold">시작:</span> {new Date(state.sessionReport.started_at).toLocaleString()}</div>}
                  {state.sessionReport.ended_at && <div><span className="font-semibold">종료:</span> {new Date(state.sessionReport.ended_at).toLocaleString()}</div>}
                  <div><span className="font-semibold">총 대화 시간:</span> {Math.floor(state.sessionReport.total_duration_sec || 0)}초</div>
                  <div><span className="font-semibold">발화 시간:</span> {Math.floor(state.sessionReport.user_speech_duration_sec || 0)}초</div>
                  <div><span className="font-semibold">메시지 수:</span> {state.sessionReport.messages?.length || 0}개</div>
                </div>
              </div>
            )}

            {/* Feedback */}
            {state.feedback && (
              <div className="bg-white p-4 rounded border">
                <h3 className="text-sm font-bold text-purple-700 mb-2">💬 AI 피드백</h3>
                <div className="text-xs text-gray-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {state.feedback}
                </div>
              </div>
            )}

            {/* Scenario Summary */}
            {state.scenarioSummary && (
              <div className="bg-white p-4 rounded border lg:col-span-2">
                <h3 className="text-sm font-bold text-green-700 mb-2">📝 대화 요약</h3>
                <div className="text-xs text-gray-700 whitespace-pre-wrap">
                  {state.scenarioSummary}
                </div>
              </div>
            )}

            {/* No Feedback Notice */}
            {state.sessionReport && !state.feedback && (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200 lg:col-span-2">
                <p className="text-xs text-yellow-800">
                  ℹ️ <strong>피드백 미생성:</strong> 대화가 충분하지 않아 분석을 진행할 수 없습니다 (10개 이상의 메시지 필요)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
