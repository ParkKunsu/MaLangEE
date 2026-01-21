"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";
import { debugLog } from "@/shared/lib/debug";
import { buildScenarioWebSocketUrl } from "@/shared/lib/websocket";
import { useWebSocketBase } from "./useWebSocketBase";
import type { ScenarioResult } from "./types";

export interface ScenarioChatStateNew {
  isConnected: boolean;
  isReady: boolean;
  logs: string[];
  aiMessage: string;
  aiMessageKR: string;
  userTranscript: string;
  isAiSpeaking: boolean;
  isRecording: boolean;
  scenarioResult: ScenarioResult | null;
}

export function useScenarioChatNew() {
  // 시나리오 특화 상태
  const [aiMessage, setAiMessage] = useState("");
  const [aiMessageKR, setAiMessageKR] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);

  // WebSocket URL 생성
  const getWebSocketUrl = useCallback(() => {
    const token = tokenStorage.get();
    debugLog("[Scenario WS] Token:", token ? "EXISTS" : "NONE");

    const finalUrl = buildScenarioWebSocketUrl(token);
    debugLog("[Scenario WS] Final WebSocket URL:", finalUrl);

    return finalUrl;
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

  // 세션 초기화 함수를 ref로 관리하여 순환 참조 방지
  const startScenarioSessionRef = useRef<(() => void) | null>(null);

  // onMessage 구현 (base를 사용할 수 있도록 여기서 정의)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    onMessageRef.current = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "ready":
          base.addLog("✅ Received 'ready'. Scenario session initialized.");
          base.addLog("ℹ️ Automatically starting scenario session...");
          base.setIsReady(true);
          // ready 수신 즉시 세션 초기화
          if (startScenarioSessionRef.current) {
            startScenarioSessionRef.current();
          }
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

        case "speech.started":
          base.addLog("User speech started (VAD)");
          base.stopAudio();
          base.setIsUserSpeaking(true);
          break;

        case "input_audio.transcript":
          if (data.transcript) {
            setUserTranscript(data.transcript);
            base.setIsUserSpeaking(false);
            base.addLog(`User: ${data.transcript}`);
          }
          break;

        case "scenario.completed":
          base.addLog(`✅ Scenario Completed: ${JSON.stringify(data.json)}`);
          base.addLog("ℹ️ Scenario has been automatically saved to the database.");
          
          const result = {
            place: data.json?.place ?? null,
            conversationPartner: data.json?.conversation_partner ?? data.json?.conversationPartner ?? null,
            conversationGoal: data.json?.conversation_goal ?? data.json?.conversationGoal ?? null,
            sessionId: data.json?.sessionId ?? data.json?.session_id,
          };
          
          setScenarioResult(result);
          break;

        case "error":
          base.addLog(`Error: ${data.message}`);
          break;
      }
    } catch (e) {
      base.addLog(`Parse Error: ${e}`);
    }
  };
  });

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

  // 시나리오 세션 초기화 및 대화 시작
  // 서버에서 세션 설정 및 AI 응답을 자동으로 처리하므로 클라이언트에서는 별도 메시지를 보내지 않음
  const startScenarioSession = useCallback(() => {
    if (base.wsRef.current?.readyState === WebSocket.OPEN && base.isReady) {
      base.addLog("Scenario session started (server handles initialization)");
    }
  }, [base.wsRef, base.isReady, base.addLog]);

  // ref에 함수 할당
  startScenarioSessionRef.current = startScenarioSession;

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
    startScenarioSession,
  };
}
