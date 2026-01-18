"use client";

import { useCallback, useRef, useState } from "react";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";
import { useWebSocketBase } from "./useWebSocketBase";

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
  sessionReport: any | null;
}

export function useConversationChatNew(sessionId: string, voice: string = "alloy") {
  // 대화 특화 상태
  const [aiMessage, setAiMessage] = useState("");
  const [aiMessageKR, setAiMessageKR] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [sessionReport, setSessionReport] = useState<any | null>(null);

  // WebSocket URL 생성
  const getWebSocketUrl = useCallback(() => {
    if (!sessionId) return "";

    const token = tokenStorage.get();
    const envWsUrl = process.env.NEXT_PUBLIC_WS_URL;
    let wsBaseUrl = envWsUrl;

    if (!wsBaseUrl && process.env.NEXT_PUBLIC_API_URL) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      wsBaseUrl = apiUrl.replace(/^http/, "ws");
      if (window.location.protocol === "https:" && wsBaseUrl.startsWith("ws:")) {
        wsBaseUrl = wsBaseUrl.replace(/^ws:/, "wss:");
      }
    }

    if (!wsBaseUrl) {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      wsBaseUrl = `${protocol}://${host}${port}`;
    }

    const endpoint = token
      ? `/api/v1/chat/ws/chat/${sessionId}`
      : `/api/v1/chat/ws/guest-chat/${sessionId}`;

    const params = new URLSearchParams();
    if (token) params.append("token", token);
    params.append("voice", voice);
    params.append("show_text", "true");

    return `${wsBaseUrl}${endpoint}?${params.toString()}`;
  }, [sessionId, voice]);

  // onMessage 콜백을 ref로 관리
  const onMessageRef = useRef<((event: MessageEvent) => void) | undefined>(undefined);

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

      switch (data.type) {
        case "session.update":
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
          break;

        case "audio.delta":
          base.playAudioChunk(data.delta, 24000);
          break;

        case "audio.done":
          base.addLog("AI audio stream completed");
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
          break;

        case "speech.stopped":
          base.addLog("User speech stopped (VAD)");
          base.setIsUserSpeaking(false);
          break;

        case "user.transcript":
          setUserTranscript(data.transcript);
          base.addLog(`User: ${data.transcript}`);
          break;

        case "disconnected":
          base.addLog(`Session disconnected: ${data.reason || "Unknown"}`);
          if (data.report) {
            setSessionReport(data.report);
            base.addLog(`Session report received: ${JSON.stringify(data.report)}`);
          }
          break;

        case "error":
          base.addLog(`Error: ${data.message}`);
          break;
      }
    } catch (e) {
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

  // 연결 해제 시 disconnect 메시지 전송
  const disconnect = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({ type: "disconnect" }));
      base.addLog("Sent disconnect request");
    }
    base.disconnect();
  }, [base.wsRef, base.addLog, base.disconnect]);

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
