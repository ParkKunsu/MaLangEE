"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { tokenStorage } from "@/features/auth";
import { config } from "@/shared/lib/config";

/**
 * WebSocket 메시지 타입
 */
export type ScenarioMessageType =
  | "ready"
  | "response.audio.delta"
  | "input_audio.transcript"
  | "scenario.completed"
  | "error"
  | "message";

export interface ScenarioMessage {
  type: ScenarioMessageType;
  delta?: string; // Base64 PCM16 오디오
  sample_rate?: number;
  transcript?: string;
  text?: string;
  content?: string;
  message?: string;
  json?: {
    place?: string;
    conversation_partner?: string;
    conversation_goal?: string;
  };
  completed?: boolean;
}

export interface ScenarioChatState {
  isConnected: boolean;
  isReady: boolean;
  aiMessage: string;
  userTranscript: string;
  isAiSpeaking: boolean;
  error: string | null;
  scenarioInfo: {
    place?: string;
    conversationPartner?: string;
    conversationGoal?: string;
  } | null;
}

/**
 * 시나리오 대화 WebSocket 훅
 * 실제 LLM과 WebSocket으로 통신
 */
export function useScenarioChat() {
  const [state, setState] = useState<ScenarioChatState>({
    isConnected: false,
    isReady: false,
    aiMessage: "",
    userTranscript: "",
    isAiSpeaking: false,
    error: null,
    scenarioInfo: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const connectionIdRef = useRef(0); // 연결 ID로 stale closure 방지

  /**
   * WebSocket URL 생성
   */
  const getWebSocketUrl = useCallback(() => {
    const token = tokenStorage.get();
    // 직접 백엔드 서버 URL 사용 (Next.js proxy는 HTTP만 지원)
    const baseUrl = "http://49.50.137.35:8080";
    const wsBaseUrl = baseUrl.replace(/^http/, "ws");

    const url = token
      ? `${wsBaseUrl}/api/v1/ws/scenario?token=${encodeURIComponent(token)}`
      : `${wsBaseUrl}/api/v1/ws/guest-scenario`;

    console.log("[WebSocket] URL:", url);
    console.log("[WebSocket] Token exists:", !!token);
    return url;
  }, []);

  /**
   * Base64 → Uint8Array
   */
  const base64ToBytes = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  /**
   * PCM16 → Float32 (재생용)
   */
  const pcm16ToFloat32 = (bytes: Uint8Array): Float32Array => {
    const samples = new Float32Array(Math.floor(bytes.length / 2));
    for (let i = 0; i < samples.length; i++) {
      const lo = bytes[i * 2];
      const hi = bytes[i * 2 + 1];
      let sample = (hi << 8) | lo;
      if (sample >= 0x8000) sample -= 0x10000;
      samples[i] = sample / 32768;
    }
    return samples;
  };

  /**
   * Float32 → PCM16 (전송용)
   */
  const float32ToPCM16 = (float32: Float32Array): Uint8Array => {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32.length; i++) {
      let sample = Math.max(-1, Math.min(1, float32[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, sample, true);
    }
    return new Uint8Array(buffer);
  };

  /**
   * Uint8Array → Base64
   */
  const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  /**
   * 오디오 재생
   */
  const playAudio = useCallback(async (base64Audio: string, sampleRate: number = 24000) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate });
      }

      const bytes = base64ToBytes(base64Audio);
      const float32 = pcm16ToFloat32(bytes);
      audioQueueRef.current.push(float32);

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setState((prev) => ({ ...prev, isAiSpeaking: true }));
        await playNextAudio();
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  }, []);

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isAiSpeaking: false }));
      return;
    }

    const float32 = audioQueueRef.current.shift()!;
    const audioContext = audioContextRef.current!;

    const audioBuffer = audioContext.createBuffer(1, float32.length, audioContext.sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => playNextAudio();
    source.start();
  };

  /**
   * WebSocket 메시지 핸들러
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: ScenarioMessage = JSON.parse(event.data);
        console.log("[WebSocket] Message received:", message.type);

        switch (message.type) {
          case "ready":
            setState((prev) => ({ ...prev, isReady: true, error: null }));
            break;

          case "response.audio.delta":
            // AI TTS 오디오 스트리밍
            if (message.delta && message.sample_rate) {
              playAudio(message.delta, message.sample_rate);
            }
            break;

          case "message":
            // AI 텍스트 메시지
            if (message.content) {
              setState((prev) => ({ ...prev, aiMessage: message.content || "" }));
            }
            break;

          case "input_audio.transcript":
            // 사용자 음성 텍스트 변환 (STT)
            if (message.transcript) {
              setState((prev) => ({ ...prev, userTranscript: message.transcript || "" }));
            }
            break;

          case "scenario.completed":
            // 시나리오 완료
            if (message.json) {
              setState((prev) => ({
                ...prev,
                scenarioInfo: {
                  place: message.json?.place,
                  conversationPartner: message.json?.conversation_partner,
                  conversationGoal: message.json?.conversation_goal,
                },
              }));
            }
            break;

          case "error":
            setState((prev) => ({ ...prev, error: message.message || "Unknown error" }));
            console.error("[WebSocket] Error:", message.message);
            break;
        }
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error);
      }
    },
    [playAudio]
  );

  /**
   * WebSocket 연결
   */
  const connect = useCallback(() => {
    // 새 연결 ID 생성 (이전 연결의 이벤트 무시용)
    const currentConnectionId = ++connectionIdRef.current;
    console.log("[WebSocket] connect() called, connectionId:", currentConnectionId);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Already connected");
      return;
    }

    // 기존 연결이 있으면 정리
    if (wsRef.current) {
      console.log("[WebSocket] Closing existing connection");
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const url = getWebSocketUrl();
      console.log("[WebSocket] Attempting connection to:", url);

      const ws = new WebSocket(url);

      ws.onopen = () => {
        // 현재 연결 ID가 최신인지 확인
        if (connectionIdRef.current !== currentConnectionId) {
          console.log("[WebSocket] Stale connection, ignoring open event");
          ws.close();
          return;
        }
        console.log("[WebSocket] ✅ Connected successfully!");
        setState((prev) => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        handleMessage(event);
      };

      ws.onclose = (event) => {
        // 현재 연결 ID가 최신인지 확인
        if (connectionIdRef.current !== currentConnectionId) {
          console.log("[WebSocket] Stale connection, ignoring close event");
          return;
        }
        console.log("[WebSocket] ❌ Disconnected:", event.code, event.reason);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isReady: false,
        }));
        wsRef.current = null;
      };

      ws.onerror = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        console.error("[WebSocket] ⚠️ Error event:", event);
        setState((prev) => ({
          ...prev,
          error: "WebSocket connection failed. Check if server is running.",
        }));
      };

      wsRef.current = ws;
      console.log("[WebSocket] WebSocket object created, waiting for connection...");
    } catch (error) {
      console.error("[WebSocket] ❌ Failed to create WebSocket:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
    }
  }, [getWebSocketUrl, handleMessage]);

  /**
   * WebSocket 연결 해제
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  /**
   * 텍스트 메시지 전송
   */
  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = { type: "text", text };
      wsRef.current.send(JSON.stringify(message));
      console.log("[WebSocket] Sent text:", text);
    } else {
      console.error("[WebSocket] Not connected");
    }
  }, []);

  /**
   * 오디오 청크 전송 (Base64 PCM16)
   */
  const sendAudioChunk = useCallback((audioData: Float32Array, sampleRate: number = 16000) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const pcm16 = float32ToPCM16(audioData);
      const base64 = bytesToBase64(pcm16);
      const message = {
        type: "input_audio_chunk",
        audio: base64,
        sample_rate: sampleRate,
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("[WebSocket] Not connected");
    }
  }, []);

  /**
   * AI 메시지 초기화
   */
  const clearAiMessage = useCallback(() => {
    setState((prev) => ({ ...prev, aiMessage: "", userTranscript: "" }));
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendText,
    sendAudioChunk,
    clearAiMessage,
  };
}
