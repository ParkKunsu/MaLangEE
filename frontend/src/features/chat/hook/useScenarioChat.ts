"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";

/**
 * WebSocket 메시지 타입 (03-FRONTEND_SCENARIO_GUIDE.md 기준)
 */
export type ScenarioMessageType =
  | "ready"
  | "response.audio.delta"
  | "response.audio.done"
  | "response.audio_transcript.delta"
  | "response.audio_transcript.done"
  | "input_audio.transcript"
  | "scenario.completed"
  | "speech.started" // 사용자 발화 시작 (Barge-in용)
  | "error";

export interface ScenarioMessage {
  type: ScenarioMessageType;
  delta?: string;           // response.audio.delta
  sample_rate?: number;     // response.audio.delta
  transcript_delta?: string; // response.audio_transcript.delta
  transcript?: string;      // response.audio_transcript.done, input_audio.transcript
  json?: {                  // scenario.completed
    place: string | null;
    conversation_partner: string | null;
    conversation_goal: string | null;
  };
  completed?: boolean;      // scenario.completed
  message?: string;         // error
}

export interface ScenarioChatState {
  isConnected: boolean;
  isReady: boolean;
  aiMessage: string;
  aiMessageKR: string;      // AI 메시지 한국어 번역본
  userTranscript: string;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  isCompleted: boolean;
  error: string | null;
  lastEvent: string | null; // 디버깅용 마지막 이벤트 타입
  scenarioResult: {
    place: string | null;
    conversationPartner: string | null;
    conversationGoal: string | null;
  } | null;
}

/**
 * 시나리오 대화 WebSocket 훅 (MaLangEE 전용)
 */
export function useScenarioChat() {
  const [state, setState] = useState<ScenarioChatState>({
    isConnected: false,
    isReady: false,
    aiMessage: "",
    aiMessageKR: "",
    userTranscript: "",
    isAiSpeaking: false,
    isUserSpeaking: false,
    isCompleted: false,
    error: null,
    lastEvent: null,
    scenarioResult: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const connectionIdRef = useRef(0);
  
  // 재연결 관련 refs
  const reconnectCountRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef(false);

  /**
   * WebSocket URL 생성
   */
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
      if (host === "localhost" || host === "127.0.0.1") {
        wsBaseUrl = `${protocol}://${host}:8080`;
      } else {
        wsBaseUrl = `${protocol}://${host}${port}`;
      }
    }

    const path = token ? "/api/v1/ws/scenario" : "/api/v1/ws/guest-scenario";
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    
    return `${wsBaseUrl}${path}${query}`;
  }, []);

  /**
   * PCM16 → Float32
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
   * Float32 → PCM16
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
   * 오디오 재생 중단 (Barge-in)
   */
  const stopAudio = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setState((prev) => ({ ...prev, isAiSpeaking: false }));
  }, []);

  /**
   * 오디오 청크 재생 (스케줄링)
   */
  const playChunk = useCallback((base64: string, sampleRate: number) => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const float32 = pcm16ToFloat32(bytes);
    const buffer = ctx.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
    source.start(startTime);
    
    nextStartTimeRef.current = startTime + buffer.duration;
    activeSourcesRef.current.push(source);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setState(prev => ({ ...prev, isAiSpeaking: false }));
      }
    };
  }, []);

  /**
   * WebSocket 메시지 핸들러
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const payload: ScenarioMessage = JSON.parse(event.data);
        console.log("[WebSocket] Received:", payload.type, payload);

        setState(prev => ({ ...prev, lastEvent: payload.type }));

        switch (payload.type) {
          case "ready":
            reconnectCountRef.current = 0;
            setState((prev) => ({ ...prev, isReady: true, error: null }));
            break;

          case "speech.started":
            // 사용자 발화 시작 감지 시 AI 음성 즉시 중단 (Barge-in)
            console.log("[WebSocket] Barge-in triggered");
            stopAudio();
            setState(prev => ({ ...prev, isUserSpeaking: true }));
            break;

          case "response.audio.delta":
            if (payload.delta) {
              const rate = payload.sample_rate || 24000;
              setState(prev => ({ ...prev, isAiSpeaking: true }));
              playChunk(payload.delta, rate);
            }
            break;

          case "response.audio_transcript.delta":
            if (payload.transcript_delta) {
              setState(prev => ({ ...prev, aiMessage: prev.aiMessage + payload.transcript_delta }));
            }
            break;

          case "response.audio_transcript.done":
            if (payload.transcript) {
              const englishText = payload.transcript;
              setState(prev => ({ ...prev, aiMessage: englishText }));
              
              // 문장이 완료되면 한국어로 번역
              translateToKorean(englishText).then(translated => {
                setState(prev => ({ ...prev, aiMessageKR: translated }));
              });
            }
            break;

          case "input_audio.transcript":
            if (payload.transcript) {
              setState(prev => ({ ...prev, userTranscript: payload.transcript || "", isUserSpeaking: false }));
            }
            break;

          case "scenario.completed":
            if (payload.json) {
              setState(prev => ({
                ...prev,
                isCompleted: true,
                scenarioResult: {
                  place: payload.json?.place || null,
                  conversationPartner: payload.json?.conversation_partner || null,
                  conversationGoal: payload.json?.conversation_goal || null,
                }
              }));
            }
            break;

          case "error":
            setState((prev) => ({ ...prev, error: payload.message || "Unknown error" }));
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("[WebSocket] Parse error:", error);
      }
    },
    [playChunk, stopAudio]
  );

  /**
   * WebSocket 연결
   */
  const connect = useCallback(() => {
    const currentConnectionId = ++connectionIdRef.current;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    isManuallyClosedRef.current = false;

    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (connectionIdRef.current !== currentConnectionId) {
          ws.close();
          return;
        }
        setState((prev) => ({ ...prev, isConnected: true, error: null, lastEvent: "open" }));
      };

      ws.onmessage = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        handleMessage(event);
      };

      ws.onclose = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        
        setState((prev) => ({ ...prev, isConnected: false, isReady: false, lastEvent: `close (${event.code})` }));
        wsRef.current = null;

        if (!isManuallyClosedRef.current && reconnectCountRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 10000);
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        if (connectionIdRef.current !== currentConnectionId) return;
        setState((prev) => ({ ...prev, error: "WebSocket connection failed.", lastEvent: "error" }));
      };

      wsRef.current = ws;
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Connection failed" }));
    }
  }, [getWebSocketUrl, handleMessage]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    stopAudio();
  }, [stopAudio]);

  /**
   * 오디오 청크 전송 (input_audio_chunk)
   */
  const sendAudioChunk = useCallback((audioData: Float32Array) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const pcm16 = float32ToPCM16(audioData);
      let binary = "";
      const len = pcm16.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(pcm16[i]);
      }
      const base64 = btoa(binary);
      wsRef.current.send(JSON.stringify({
        type: "input_audio_chunk",
        audio: base64,
        sample_rate: 16000
      }));
    }
  }, []);

  /**
   * 텍스트 전송 (text)
   */
  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text }));
    }
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendText,
    sendAudioChunk,
    initAudio,
  };
}
