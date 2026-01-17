"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { tokenStorage } from "@/features/auth";

/**
 * WebSocket 메시지 타입 (OpenAI Realtime API 표준)
 */
export type GeneralChatMessageType =
  | "session.created"
  | "session.updated"
  | "conversation.item.created"
  | "response.audio.delta"
  | "response.audio.done"
  | "response.text.delta"
  | "response.text.done"
  | "input_audio_buffer.speech_started"
  | "input_audio_buffer.speech_stopped"
  | "disconnected"
  | "error";

export interface GeneralChatMessage {
  type: GeneralChatMessageType;
  delta?: string;           // response.audio.delta
  sample_rate?: number;     // response.audio.delta
  text_delta?: string;      // response.text.delta
  text?: string;            // response.text.done
  session?: {               // session.created
    id: string;
    model: string;
    voice: string;
  };
  message?: string;         // error
  reason?: string;          // disconnected
  report?: {                // disconnected - 세션 리포트
    session_id: string;
    total_duration_sec: number;
    user_speech_duration_sec: number;
    messages: any[];
  };
}

export interface GeneralChatState {
  isConnected: boolean;
  isReady: boolean;
  aiMessage: string;
  userTranscript: string;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  error: string | null;
  lastEvent: string | null;
  sessionInfo: { id: string; model: string; voice: string; } | null;
}

interface UseGeneralChatOptions {
  sessionId: string;
  voice?: string;
  showText?: boolean;
  autoConnect?: boolean;
}

/**
 * 일반 대화 WebSocket 훅 (MaLangEE 전용)
 */
export function useGeneralChat(options: UseGeneralChatOptions) {
  const { sessionId, voice = "alloy", showText = true, autoConnect = true } = options;

  const [state, setState] = useState<GeneralChatState>({
    isConnected: false,
    isReady: false,
    aiMessage: "",
    userTranscript: "",
    isAiSpeaking: false,
    isUserSpeaking: false,
    error: null,
    lastEvent: null,
    sessionInfo: null,
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

    const endpoint = token
      ? `/api/v1/chat/ws/chat/${sessionId}`
      : `/api/v1/chat/ws/guest-chat/${sessionId}`;

    const params = new URLSearchParams();
    if (token) params.append("token", token);
    params.append("voice", voice);
    params.append("show_text", showText.toString());

    return `${wsBaseUrl}${endpoint}?${params.toString()}`;
  }, [sessionId, voice, showText]);

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
    buffer.copyToChannel(float32 as Float32Array<ArrayBuffer>, 0);

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
        const payload: GeneralChatMessage = JSON.parse(event.data);
        console.log("[WebSocket] Received:", payload.type, payload);

        setState(prev => ({ ...prev, lastEvent: payload.type }));

        switch (payload.type) {
          case "session.created":
            reconnectCountRef.current = 0;
            setState((prev) => ({
              ...prev,
              isReady: true,
              error: null,
              sessionInfo: payload.session || null
            }));
            break;

          case "input_audio_buffer.speech_started":
            // 사용자 발화 시작 감지 시 AI 음성 즉시 중단 (Barge-in)
            console.log("[WebSocket] Barge-in triggered");
            stopAudio();
            setState(prev => ({ ...prev, isUserSpeaking: true }));
            break;

          case "input_audio_buffer.speech_stopped":
            setState(prev => ({ ...prev, isUserSpeaking: false }));
            break;

          case "response.audio.delta":
            if (payload.delta) {
              const rate = payload.sample_rate || 24000;
              setState(prev => ({ ...prev, isAiSpeaking: true }));
              playChunk(payload.delta, rate);
            }
            break;

          case "response.text.delta":
            if (payload.text_delta) {
              setState(prev => ({ ...prev, aiMessage: prev.aiMessage + payload.text_delta }));
            }
            break;

          case "response.text.done":
            if (payload.text) {
              setState(prev => ({ ...prev, aiMessage: payload.text || "" }));
            }
            break;

          case "conversation.item.created":
            // 대화 항목 추가 (필요시 처리)
            break;

          case "disconnected":
            // 서버에서 세션 종료 응답 받음
            console.log("[WebSocket] Session ended:", payload.report);
            if (payload.report) {
              console.log("[WebSocket] Session report:", {
                duration: payload.report.total_duration_sec,
                userSpeech: payload.report.user_speech_duration_sec,
                messages: payload.report.messages.length
              });
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

    // WebSocket이 열려있으면 disconnect 메시지 전송
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Sending disconnect message");
      wsRef.current.send(JSON.stringify({ type: "disconnect" }));

      // 서버 응답을 기다린 후 연결 종료 (1초 대기)
      setTimeout(() => {
        wsRef.current?.close();
        wsRef.current = null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
        stopAudio();
      }, 1000);
    } else {
      // WebSocket이 이미 닫혀있으면 바로 정리
      wsRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      stopAudio();
    }
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
    if (autoConnect) {
      connect();
    }
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendAudioChunk,
    initAudio,
  };
}
