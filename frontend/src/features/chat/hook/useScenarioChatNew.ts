"use client";

import { useState, useCallback, useRef } from "react";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";
import { useWebSocketBase } from "./useWebSocketBase";

export interface ScenarioChatStateNew {
  isConnected: boolean;
  isReady: boolean;
  logs: string[];
  aiMessage: string;
  aiMessageKR: string;
  userTranscript: string;
  isAiSpeaking: boolean;
  isRecording: boolean;
  scenarioResult: any | null;
}

export function useScenarioChatNew() {
  // 시나리오 특화 상태
  const [aiMessage, setAiMessage] = useState("");
  const [aiMessageKR, setAiMessageKR] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [scenarioResult, setScenarioResult] = useState<any | null>(null);

  // WebSocket URL 생성
  const getWebSocketUrl = useCallback(() => {
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

    const endpoint = token ? "/api/v1/ws/scenario" : "/api/v1/ws/guest-scenario";
    const params = new URLSearchParams();
    if (token) params.append("token", token);

    return `${wsBaseUrl}${endpoint}?${params.toString()}`;
  }, []);

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
        case "ready":
          base.addLog("Received 'ready'.");
          base.setIsReady(true);
          break;

        case "response.audio.delta":
          base.playAudioChunk(data.delta, data.sample_rate || 24000);
          break;

        case "response.audio.done":
          base.addLog("AI audio stream completed");
          break;

        case "response.audio_transcript.delta":
          if (data.transcript_delta) {
            setAiMessage(prev => prev + data.transcript_delta);
            base.addLog(`AI (delta): ${data.transcript_delta}`);
          }
          break;

        case "response.audio_transcript.done":
          setAiMessage(data.transcript);
          base.addLog(`AI: ${data.transcript}`);
          translateToKorean(data.transcript).then(translated => {
            setAiMessageKR(translated);
            base.addLog(`AI (KR): ${translated}`);
          });
          break;

        case "input_audio.transcript":
          if (data.transcript) {
            setUserTranscript(data.transcript);
            base.addLog(`User: ${data.transcript}`);
          }
          break;

        case "scenario.completed":
          base.addLog(`Scenario Completed: ${JSON.stringify(data.json)}`);
          setScenarioResult(data.json);
          break;

        case "error":
          base.addLog(`Error: ${data.message}`);
          break;
      }
    } catch (e) {
      base.addLog(`Parse Error: ${e}`);
    }
  };

  // 오디오 전송 콜백 (Scenario 메시지 타입 사용)
  const sendAudioCallback = useCallback((audioData: Float32Array) => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      const base64 = base.encodeAudio(audioData);
      base.wsRef.current.send(JSON.stringify({
        type: "input_audio_chunk",
        audio: base64,
        sample_rate: 24000
      }));
    }
  }, [base.wsRef, base.encodeAudio]);

  // 마이크 시작 (base의 startMicrophone + sendAudioCallback)
  const startMicrophone = useCallback(() => {
    return base.startMicrophone(sendAudioCallback);
  }, [base.startMicrophone, sendAudioCallback]);

  // 텍스트 전송
  const sendText = useCallback((text: string) => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({ type: "text", text }));
      base.addLog(`Sent Text: ${text}`);
    }
  }, [base.wsRef, base.addLog]);

  // 오디오 버퍼 초기화
  const clearAudioBuffer = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({ type: "input_audio_clear" }));
      base.addLog("Sent input_audio_clear");
    }
  }, [base.wsRef, base.addLog]);

  // 오디오 커밋
  const commitAudio = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN) {
      base.wsRef.current.send(JSON.stringify({ type: "input_audio_commit" }));
      base.addLog("Sent input_audio_commit");
    }
  }, [base.wsRef, base.addLog]);

  return {
    state: {
      isConnected: base.isConnected,
      isReady: base.isReady,
      logs: base.logs,
      aiMessage,
      aiMessageKR,
      userTranscript,
      isAiSpeaking: base.isAiSpeaking,
      isRecording: base.isRecording,
      scenarioResult,
    },
    connect: base.connect,
    disconnect: base.disconnect,
    initAudio: base.initAudio,
    startMicrophone,
    stopMicrophone: base.stopMicrophone,
    sendText,
    toggleMute: base.toggleMute,
    clearAudioBuffer,
    commitAudio,
  };
}
