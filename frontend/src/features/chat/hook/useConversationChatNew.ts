"use client";

import { useCallback, useRef, useState } from "react";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";
import { debugLog, debugError } from "@/shared/lib/debug";
import { buildConversationWebSocketUrl, WEBSOCKET_CONSTANTS } from "@/shared/lib/websocket";
import { useWebSocketBase } from "./useWebSocketBase";
import type { SessionReport } from "./types";

const DISCONNECT_TIMEOUT_MS = WEBSOCKET_CONSTANTS.TIMEOUT.DISCONNECT_MS;

export interface ConversationChatStateNew {
  isConnected: boolean;
  isReady: boolean;
  logs: string[];
  aiMessage: string;
  aiMessageKR: string;
  userTranscript: string;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  isRecording: boolean;
  sessionReport: SessionReport | null;
  feedback?: string;
  scenarioSummary?: string;
  /** AI 오디오 완료 시점 (힌트 타이머용) */
  lastAiAudioDoneAt: number | null;
}

export function useConversationChatNew(sessionId: string, voice: string = "alloy") {
  // 대화 특화 상태
  const [aiMessage, setAiMessage] = useState("");
  const [aiMessageKR, setAiMessageKR] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null);
  const [feedback, setFeedback] = useState<string | undefined>(undefined);
  const [scenarioSummary, setScenarioSummary] = useState<string | undefined>(undefined);
  const [lastAiAudioDoneAt, setLastAiAudioDoneAt] = useState<number | null>(null);

  // WebSocket URL 생성
  const getWebSocketUrl = useCallback(() => {
    if (!sessionId) return "";

    const token = tokenStorage.get();
    return buildConversationWebSocketUrl(sessionId, token, voice, true);
  }, [sessionId, voice]);

  // onMessage 콜백을 ref로 관리
  const onMessageRef = useRef<((event: MessageEvent) => void) | undefined>(undefined);
  // disconnect 타임아웃 관리
  const disconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // disconnect Promise resolve 함수 저장
  const disconnectResolveRef = useRef<((report: any | null) => void) | null>(null);

  // useWebSocketBase 사용
  const base = useWebSocketBase({
    getWebSocketUrl,
    onMessage: useCallback((event: MessageEvent) => {
      onMessageRef.current?.(event);
    }, []),
    autoConnect: false,
  });

  // onMessage 구현 (base를 사용할 수 있도록 여기서 정의)
  onMessageRef.current = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      debugLog("[WebSocket] Received message type:", data.type, "data:", data);

      switch (data.type) {
        case "session.update":
          debugLog("[WebSocket] ✅ session.update received! Setting isReady = true");
          base.addLog("Received 'session.update'. Sending init messages...");
          base.setIsReady(true);

          // Session Update (config 필드 사용)
          base.wsRef.current?.send(
            JSON.stringify({
              type: "session.update",
              config: {
                voice: voice,
              },
            })
          );
          base.addLog("Sent session.update (config)");
          debugLog("[WebSocket] Sent session.update with voice:", voice);
          break;

        case "session.created":
        case "ready":
        case "connected":
          debugLog("[WebSocket] ✅ Session ready event received! Setting isReady = true");
          base.setIsReady(true);
          break;

        case "audio.delta":
          // audio.delta를 받았다는 것은 세션이 준비되었다는 의미
          if (!base.isReady) {
            debugLog("[WebSocket] ✅ audio.delta received! Session is ready. Setting isReady = true");
            base.setIsReady(true);
          }
          base.playAudioChunk(data.delta, 24000);
          break;

        case "audio.done":
          base.addLog("AI audio stream completed");
          setLastAiAudioDoneAt(Date.now());
          break;

        case "transcript.done":
          setAiMessage(data.transcript);
          base.addLog(`AI: ${data.transcript}`);
          translateToKorean(data.transcript).then((translated) => {
            setAiMessageKR(translated);
            base.addLog(`AI (KR): ${translated}`);
          });
          break;

        case "speech.started":
          base.addLog("User speech started (VAD)");
          base.stopAudio();
          base.setIsUserSpeaking(true);
          setLastAiAudioDoneAt(null); // 사용자 발화 시작 시 힌트 타이머 리셋
          break;

        case "speech.stopped":
          base.addLog("User speech stopped (VAD)");
          base.setIsUserSpeaking(false);
          break;

        case "user.transcript":
          setUserTranscript(data.transcript);
          base.addLog(`User: ${data.transcript}`);
          break;

        case "disconnected": {
          // 타임아웃 취소
          if (disconnectTimeoutRef.current) {
            clearTimeout(disconnectTimeoutRef.current);
            disconnectTimeoutRef.current = null;
          }
          base.addLog(`Session disconnected: ${data.reason || "Unknown"}`);
          debugLog("[WebSocket] Received disconnected response");

          const report = data.report || null;
          if (report) {
            setSessionReport(report);
            base.addLog(`Session report received: ${JSON.stringify(report)}`);
            debugLog("[WebSocket] Session report:", report);
          }

          // disconnected 응답을 받은 후 WebSocket 정리
          base.disconnect();

          // Promise resolve 호출
          if (disconnectResolveRef.current) {
            disconnectResolveRef.current(report);
            disconnectResolveRef.current = null;
          }
          break;
        }

        case "error":
          debugError("[WebSocket] ❌ Error received:", data.message);
          base.addLog(`Error: ${data.message}`);
          break;

        default:
          debugLog("[WebSocket] ⚠️ Unknown message type:", data.type);
          base.addLog(`Unknown type: ${data.type}`);
          break;
      }
    } catch (e) {
      debugError("[WebSocket] Parse Error:", e);
      base.addLog(`Parse Error: ${e}`);
    }
  };

  // 오디오 전송 콜백 (Conversation 메시지 타입 사용)
  const sendAudioCallback = useCallback(
    (audioData: Float32Array) => {
      if (base.wsRef.current?.readyState === WebSocket.OPEN) {
        const base64 = base.encodeAudio(audioData);
        base.wsRef.current.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64,
          })
        );
      }
    },
    [base.wsRef, base.encodeAudio]
  );

  // 마이크 시작 (base의 startMicrophone + sendAudioCallback)
  const startMicrophone = useCallback(() => {
    return base.startMicrophone(sendAudioCallback);
  }, [base.startMicrophone, sendAudioCallback]);

  // 텍스트 전송
  const sendText = useCallback(
    (text: string) => {
      if (base.wsRef.current?.readyState === WebSocket.OPEN) {
        base.wsRef.current.send(JSON.stringify({ type: "text", text }));
        base.addLog(`Sent Text: ${text}`);

        base.wsRef.current.send(JSON.stringify({ type: "response.create" }));
        base.addLog("Sent response.create (after text)");
      }
    },
    [base.wsRef, base.addLog]
  );

  // 오디오 커밋
  const commitAudio = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      base.addLog("Sent input_audio_buffer.commit");
    }
  }, [base.wsRef, base.addLog]);

  // 목소리 변경
  const updateVoice = useCallback(
    (newVoice: string) => {
      if (base.wsRef.current?.readyState === WebSocket.OPEN) {
        base.wsRef.current.send(
          JSON.stringify({
            type: "session.update",
            config: {
              voice: newVoice,
            },
          })
        );
        base.addLog(`Sent session.update with voice: ${newVoice}`);
      }
    },
    [base.wsRef, base.addLog]
  );

  // AI 응답 요청
  const requestResponse = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({ type: "response.create" }));
      base.addLog("Sent response.create (manual trigger)");
    }
  }, [base.wsRef, base.addLog]);

  // 연결 해제 시 disconnect 메시지 전송 (Promise 반환)
  const disconnect = useCallback((): Promise<any | null> => {
    return new Promise((resolve) => {
      // 이미 disconnect 요청 중이면 중복 요청 방지
      if (disconnectTimeoutRef.current) {
        debugLog("[WebSocket] Disconnect already in progress");
        resolve(null);
        return;
      }

      if (base.wsRef.current?.readyState === WebSocket.OPEN) {
        // resolve 함수 저장 (disconnected 응답 시 호출됨)
        disconnectResolveRef.current = resolve;

        // ✅ 마이크 먼저 중지 (오디오 전송 중단)
        base.stopMicrophone();
        base.addLog("Microphone stopped before disconnect");
        debugLog("[WebSocket] Microphone stopped before disconnect");

        base.wsRef.current.send(JSON.stringify({ type: "disconnect" }));
        base.addLog("Sent disconnect request, waiting for disconnected response...");
        debugLog("[WebSocket] Sent disconnect request, waiting for server response...");

        // 타임아웃 설정: 서버 응답이 없으면 강제 연결 해제
        disconnectTimeoutRef.current = setTimeout(() => {
          debugLog("[WebSocket] Disconnect timeout - forcing close");
          base.addLog("Disconnect timeout - forcing close");
          disconnectTimeoutRef.current = null;
          disconnectResolveRef.current = null;
          base.disconnect();
          resolve(null);
        }, DISCONNECT_TIMEOUT_MS);
      } else {
        // WebSocket이 이미 닫혀있으면 바로 정리
        base.disconnect();
        resolve(null);
      }
    });
  }, [base]);

  return {
    state: {
      isConnected: base.isConnected,
      isReady: base.isReady,
      logs: base.logs,
      aiMessage,
      aiMessageKR,
      userTranscript,
      isAiSpeaking: base.isAiSpeaking,
      isUserSpeaking: base.isUserSpeaking,
      isRecording: base.isRecording,
      sessionReport,
      feedback,
      scenarioSummary,
      lastAiAudioDoneAt,
    },
    connect: base.connect,
    disconnect,
    initAudio: base.initAudio,
    startMicrophone,
    stopMicrophone: base.stopMicrophone,
    sendText,
    commitAudio,
    updateVoice,
    requestResponse,
    toggleMute: base.toggleMute,
  };
}
