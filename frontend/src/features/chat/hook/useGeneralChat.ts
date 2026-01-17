"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";

/**
 * 통합된 WebSocket 메시지 타입
 */
export type ChatMessageType =
  // General Chat Types
  | "session.created"
  | "session.updated"
  | "conversation.item.created"
  | "audio.delta"
  | "audio.done"
  | "transcript.done"
  | "speech.started"
  | "speech.stopped"
  | "user.transcript"
  | "response.text.delta"
  | "response.text.done"
  // Scenario Chat Types (Additional)
  | "ready"
  | "response.audio.delta"
  | "response.audio.done"
  | "response.audio_transcript.delta"
  | "response.audio_transcript.done"
  | "input_audio.transcript"
  | "scenario.completed"
  // Common
  | "disconnected"
  | "error";

export interface ChatMessage {
  type: ChatMessageType;
  // Common / General
  delta?: string;
  sample_rate?: number;
  text_delta?: string;
  text?: string;
  transcript?: string;
  transcript_delta?: string; // Scenario
  session?: {
    id: string;
    model: string;
    voice: string;
  };
  message?: string;
  reason?: string;
  report?: {
    session_id: string;
    total_duration_sec: number;
    user_speech_duration_sec: number;
    messages: any[];
  };
  // Scenario Specific
  json?: {
    place: string | null;
    conversation_partner: string | null;
    conversation_goal: string | null;
    sessionId?: string;
  };
  completed?: boolean;
}

export interface ChatState {
  isConnected: boolean;
  isReady: boolean;
  aiMessage: string;
  aiMessageKR?: string; // Scenario specific
  userTranscript: string;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  isCompleted?: boolean; // Scenario specific
  error: string | null;
  lastEvent: string | null;
  sessionInfo: { id: string; model: string; voice: string; } | null;
  scenarioResult?: { // Scenario specific
    place: string | null;
    conversationPartner: string | null;
    conversationGoal: string | null;
    sessionId?: string;
  } | null;
}

interface UseGeneralChatOptions {
  mode: "general" | "scenario";
  sessionId?: string; // General 모드에서는 필수, Scenario 모드에서는 선택(또는 불필요)
  voice?: string;
  showText?: boolean;
  autoConnect?: boolean;
}

/**
 * 통합 대화 WebSocket 훅 (General + Scenario)
 */
export function useGeneralChat(options: UseGeneralChatOptions) {
  const { mode, sessionId, voice = "alloy", showText = true, autoConnect = true } = options;
  const router = useRouter();

  const [state, setState] = useState<ChatState>({
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
    sessionInfo: null,
    scenarioResult: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const connectionIdRef = useRef(0);
  const handleMessageRef = useRef<((event: MessageEvent) => void) | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const speakingEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // 재연결 관련 refs
  const reconnectCountRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef(false);

  // 타임아웃 관련 refs
  const aiSpeakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioTimeRef = useRef<number>(0);

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

    let endpoint = "";
    const params = new URLSearchParams();

    if (mode === "general") {
      if (!sessionId) {
        // sessionId가 없으면 아직 준비되지 않은 상태이므로 조용히 리턴
        return "";
      }
      endpoint = token
        ? `/api/v1/chat/ws/chat/${sessionId}`
        : `/api/v1/chat/ws/guest-chat/${sessionId}`;
      
      if (token) params.append("token", token);
      params.append("voice", voice);
      params.append("show_text", showText.toString());
    } else {
      // Scenario Mode
      endpoint = token ? "/api/v1/ws/scenario" : "/api/v1/ws/guest-scenario";
      if (token) params.append("token", token);
      // 시나리오 모드는 voice, show_text 파라미터를 현재 API 스펙상 사용하지 않거나 내부적으로 처리할 수 있음
      // 필요하다면 추가: params.append("voice", voice);
    }

    const queryString = params.toString();
    return queryString ? `${wsBaseUrl}${endpoint}?${queryString}` : `${wsBaseUrl}${endpoint}`;
  }, [mode, sessionId, voice, showText]);

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
    if (speakingEndTimeoutRef.current) {
      clearTimeout(speakingEndTimeoutRef.current);
      speakingEndTimeoutRef.current = null;
    }

    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setState((prev) => ({ ...prev, isAiSpeaking: false }));
  }, []);

  /**
   * AI Speaking 타임아웃 리셋
   */
  const resetAiSpeakingTimeout = useCallback(() => {
    if (aiSpeakingTimeoutRef.current) {
      clearTimeout(aiSpeakingTimeoutRef.current);
    }
    lastAudioTimeRef.current = Date.now();
    aiSpeakingTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isAiSpeaking: false }));
    }, 3000);
  }, []);

  /**
   * 응답 대기 타임아웃 시작
   */
  const startResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    responseTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        isAiSpeaking: false,
        error: "응답 대기 시간 초과. 다시 말해주세요."
      }));
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 3000);
    }, 8000);
  }, []);

  /**
   * 응답 타임아웃 취소
   */
  const clearResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  /**
   * 오디오 청크 재생
   */
  const playChunk = useCallback((base64: string, sampleRate: number) => {
    if (isPausedRef.current) return;

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    if (speakingEndTimeoutRef.current) {
      clearTimeout(speakingEndTimeoutRef.current);
      speakingEndTimeoutRef.current = null;
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
    
    if (gainNodeRef.current) {
      source.connect(gainNodeRef.current);
    } else {
      source.connect(ctx.destination);
    }

    const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
    source.start(startTime);

    nextStartTimeRef.current = startTime + buffer.duration;
    activeSourcesRef.current.push(source);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        speakingEndTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, isAiSpeaking: false }));
          speakingEndTimeoutRef.current = null;
        }, 300);
      }
    };
  }, []);

  /**
   * 음소거 토글
   */
  const toggleMute = useCallback((isMuted: boolean) => {
    if (gainNodeRef.current && audioContextRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(currentTime);
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : 1, currentTime + 0.1);
    }
  }, []);

  /**
   * 일시정지 토글
   */
  const togglePause = useCallback((isPaused: boolean) => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      stopAudio();
      setState(prev => ({ ...prev, isUserSpeaking: false }));
    }
  }, [stopAudio]);

  /**
   * WebSocket 메시지 핸들러
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const payload: ChatMessage = JSON.parse(event.data);
        // console.log("[WebSocket] Received:", payload.type, payload);

        setState(prev => ({ ...prev, lastEvent: payload.type }));

        switch (payload.type) {
          // --- Common / General ---
          case "session.created":
          case "ready": // Scenario
            reconnectCountRef.current = 0;
            setState((prev) => ({
              ...prev,
              isReady: true,
              error: null,
              sessionInfo: payload.session || null
            }));
            
            // General 모드일 때만 초기 설정 전송
            if (mode === "general" && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: "session.update",
                session: {
                  instructions: "You must respond only in English. You are an English conversation tutor helping users practice English. Always speak in English regardless of what language the user speaks. If the user's input is empty or unclear, ask them to clarify or suggest a topic.",
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.7,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 2500
                  }
                }
              }));
              
              wsRef.current.send(JSON.stringify({
                type: "response.create",
                response: {
                  modalities: ["text", "audio"],
                  instructions: "Greet the user warmly and ask if they want to continue the previous conversation or talk about something else. If there is no previous context, just say hello and ask how they are doing."
                }
              }));
            }
            break;

          case "speech.started":
            if (isPausedRef.current) return;
            stopAudio();
            setState(prev => ({ ...prev, isUserSpeaking: true }));
            break;

          case "speech.stopped":
            if (isPausedRef.current) return;
            setState(prev => ({ ...prev, isUserSpeaking: false }));
            if (mode === "general") startResponseTimeout();
            break;

          case "audio.delta": // General
          case "response.audio.delta": // Scenario
            if (isPausedRef.current) return;
            if (payload.delta) {
              const rate = payload.sample_rate || 24000;
              clearResponseTimeout();
              resetAiSpeakingTimeout();
              setState(prev => ({ ...prev, isAiSpeaking: true, error: null }));
              playChunk(payload.delta, rate);
            }
            break;

          case "audio.done": // General
          case "response.audio.done": // Scenario
            // 오디오 재생 완료 처리 (필요시)
            break;

          case "transcript.done": // General
            if (payload.transcript) {
              setState(prev => ({ ...prev, aiMessage: payload.transcript || "" }));
            }
            break;
          
          case "response.audio_transcript.delta": // Scenario
            if (payload.transcript_delta) {
              setState(prev => ({ ...prev, aiMessage: prev.aiMessage + payload.transcript_delta }));
            }
            break;

          case "response.audio_transcript.done": // Scenario
            if (payload.transcript) {
              const englishText = payload.transcript;
              setState(prev => ({ ...prev, aiMessage: englishText }));
              // 시나리오 모드에서는 번역 수행
              if (mode === "scenario") {
                translateToKorean(englishText).then(translated => {
                  setState(prev => ({ ...prev, aiMessageKR: translated }));
                });
              }
            }
            break;

          case "user.transcript": // General
          case "input_audio.transcript": // Scenario
            if (payload.transcript) {
              setState(prev => ({ ...prev, userTranscript: payload.transcript || "", isUserSpeaking: false }));
            }
            break;

          case "response.text.delta": // General
            if (payload.text_delta) {
              setState(prev => ({ ...prev, aiMessage: prev.aiMessage + payload.text_delta }));
            }
            break;

          case "response.text.done": // General
            if (payload.text) {
              setState(prev => ({ ...prev, aiMessage: payload.text || "" }));
            }
            break;

          case "scenario.completed": // Scenario
            if (payload.json) {
              setState(prev => ({
                ...prev,
                isCompleted: true,
                scenarioResult: {
                  place: payload.json?.place || null,
                  conversationPartner: payload.json?.conversation_partner || null,
                  conversationGoal: payload.json?.conversation_goal || null,
                  sessionId: payload.json?.sessionId,
                }
              }));
            }
            break;

          case "disconnected":
            if (payload.report) {
              // 세션 리포트 저장
              if (typeof window !== "undefined") {
                localStorage.setItem("chatReport", JSON.stringify(payload.report));
              }
              // 완료 페이지로 이동
              router.push("/chat/complete");
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
    [mode, playChunk, stopAudio, startResponseTimeout, clearResponseTimeout, resetAiSpeakingTimeout, router]
  );

  handleMessageRef.current = handleMessage;

  /**
   * WebSocket 연결
   */
  const connect = useCallback(() => {
    const currentConnectionId = ++connectionIdRef.current;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    isManuallyClosedRef.current = false;

    try {
      const url = getWebSocketUrl();
      if (!url) return; // URL 생성 실패 시 중단

      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (connectionIdRef.current !== currentConnectionId) {
          ws.close();
          return;
        }
        setState((prev) => ({ ...prev, isConnected: true, error: null, lastEvent: "open" }));
        window.dispatchEvent(new CustomEvent("socket-status", { detail: { isConnected: true } }));
      };

      ws.onmessage = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        handleMessageRef.current?.(event);
      };

      ws.onclose = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;

        setState((prev) => ({ ...prev, isConnected: false, isReady: false, lastEvent: `close (${event.code})` }));
        window.dispatchEvent(new CustomEvent("socket-status", { detail: { isConnected: false } }));
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
  }, [getWebSocketUrl]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (aiSpeakingTimeoutRef.current) clearTimeout(aiSpeakingTimeoutRef.current);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    if (speakingEndTimeoutRef.current) clearTimeout(speakingEndTimeoutRef.current);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // General 모드일 때만 disconnect 메시지 전송 (시나리오 모드는 그냥 닫아도 됨)
      if (mode === "general") {
        wsRef.current.send(JSON.stringify({ type: "disconnect" }));
      }
      
      setTimeout(() => {
        wsRef.current?.close();
        wsRef.current = null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
        stopAudio();
        window.dispatchEvent(new CustomEvent("socket-status", { detail: { isConnected: false } }));
      }, 1000);
    } else {
      wsRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      stopAudio();
      window.dispatchEvent(new CustomEvent("socket-status", { detail: { isConnected: false } }));
    }
  }, [mode, stopAudio]);

  /**
   * 오디오 청크 전송
   */
  const sendAudioChunk = useCallback((audioData: Float32Array) => {
    if (isPausedRef.current) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const pcm16 = float32ToPCM16(audioData);
      let binary = "";
      const len = pcm16.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(pcm16[i]);
      }
      const base64 = btoa(binary);

      if (mode === "general") {
        wsRef.current.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64
        }));
      } else {
        // Scenario Mode
        wsRef.current.send(JSON.stringify({
          type: "input_audio_chunk",
          audio: base64,
          sample_rate: 16000 // 시나리오 모드는 16k 사용
        }));
      }
    }
  }, [mode]);

  /**
   * 텍스트 전송 (Scenario Mode)
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
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
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
    sendText,
    initAudio,
    toggleMute,
    togglePause,
  };
}
