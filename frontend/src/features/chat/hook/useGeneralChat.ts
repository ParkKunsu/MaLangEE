"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { tokenStorage } from "@/features/auth";

/**
 * WebSocket 메시지 타입 (Backend custom types)
 * Note: Backend는 OpenAI 표준 대신 단순화된 타입을 사용
 */
export type GeneralChatMessageType =
  | "session.created"
  | "session.updated"
  | "conversation.item.created"
  | "audio.delta"                    // Backend custom: AI 음성 청크
  | "audio.done"                     // Backend custom: AI 음성 완료
  | "transcript.done"                // Backend custom: AI 텍스트 자막
  | "speech.started"                 // Backend custom: 사용자 발화 시작
  | "speech.stopped"                 // Backend custom: 사용자 발화 종료
  | "user.transcript"                // Backend custom: 사용자 STT 자막
  | "response.text.delta"
  | "response.text.done"
  | "disconnected"
  | "error";

export interface GeneralChatMessage {
  type: GeneralChatMessageType;
  delta?: string;           // audio.delta
  sample_rate?: number;     // audio.delta
  text_delta?: string;      // response.text.delta
  text?: string;            // response.text.done
  transcript?: string;      // transcript.done, user.transcript
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
  const handleMessageRef = useRef<((event: MessageEvent) => void) | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null); // 볼륨 제어용 GainNode
  const speakingEndTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 말하기 종료 지연 타이머
  const isPausedRef = useRef(false); // 일시정지 상태

  // 재연결 관련 refs
  const reconnectCountRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef(false);

  // [Fix] 타임아웃 관련 refs - 응답 없을 때 상태 리셋용
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

    // 토큰 유무에 따라 엔드포인트 분기 (회원/비회원)
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
    // 말하기 종료 타이머 클리어
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
   * [Fix] AI Speaking 타임아웃 리셋
   * 마지막 audio.delta 후 3초간 새 오디오 없으면 isAiSpeaking을 false로
   */
  const resetAiSpeakingTimeout = useCallback(() => {
    if (aiSpeakingTimeoutRef.current) {
      clearTimeout(aiSpeakingTimeoutRef.current);
    }
    lastAudioTimeRef.current = Date.now();
    aiSpeakingTimeoutRef.current = setTimeout(() => {
      console.log("[Timeout] AI speaking timeout - forcing state reset");
      setState(prev => ({ ...prev, isAiSpeaking: false }));
    }, 3000);
  }, []);

  /**
   * [Fix] 응답 대기 타임아웃 시작
   * 사용자 발화 종료 후 8초간 AI 응답 없으면 에러 표시
   */
  const startResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    responseTimeoutRef.current = setTimeout(() => {
      console.log("[Timeout] Response timeout - no AI response received");
      setState(prev => ({ 
        ...prev, 
        isAiSpeaking: false,
        error: "응답 대기 시간 초과. 다시 말해주세요."
      }));
      // 3초 후 에러 메시지 클리어
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 3000);
    }, 8000);
  }, []);

  /**
   * [Fix] 응답 타임아웃 취소 (AI가 응답을 시작하면)
   */
  const clearResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  /**
   * 오디오 청크 재생 (스케줄링)
   */
  const playChunk = useCallback((base64: string, sampleRate: number) => {
    // 일시정지 상태면 재생하지 않음
    if (isPausedRef.current) return;

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
      
      // GainNode 생성 및 연결 (볼륨 제어용)
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    // 말하기 종료 타이머가 있다면 취소 (연속 재생 시 끊김 방지)
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
    
    // GainNode를 통해 출력 연결
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
        // 즉시 false로 변경하지 않고 약간의 지연을 두어 자연스러운 상태 유지
        speakingEndTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, isAiSpeaking: false }));
          speakingEndTimeoutRef.current = null;
        }, 300);
      }
    };
  }, []);

  /**
   * 음소거 토글 함수
   */
  const toggleMute = useCallback((isMuted: boolean) => {
    if (gainNodeRef.current && audioContextRef.current) {
      // 0.1초 동안 부드럽게 볼륨 조절 (클릭 노이즈 방지)
      const currentTime = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(currentTime);
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : 1, currentTime + 0.1);
    }
  }, []);

  /**
   * 일시정지 토글 함수
   */
  const togglePause = useCallback((isPaused: boolean) => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      // 일시정지 시 현재 재생 중인 오디오 중단
      stopAudio();
      // 마이크 입력도 차단해야 하므로 isUserSpeaking 상태 초기화
      setState(prev => ({ ...prev, isUserSpeaking: false }));
    }
  }, [stopAudio]);

  /**
   * WebSocket 메시지 핸들러
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const payload: GeneralChatMessage = JSON.parse(event.data);
        //console.log("[WebSocket] Received:", payload.type, payload);

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
            // [Fix] 세션 설정 업데이트
            // 1. VAD: silence_duration_ms 증가 (사용자가 말을 끝낼 때까지 더 오래 기다림)
            // 2. Instructions: 영어로만 응답하도록 지시
            if (wsRef.current?.readyState === WebSocket.OPEN) {
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
              console.log("[WebSocket] Sent session.update: English-only + silence_duration 2500ms");
              
              // 세션 생성 직후 AI가 먼저 발화하도록 요청 (response.create)
              // 이는 대화 재개 시 AI가 먼저 말을 걸게 하기 위함
              wsRef.current.send(JSON.stringify({
                type: "response.create",
                response: {
                  modalities: ["text", "audio"],
                  instructions: "Greet the user warmly and ask if they want to continue the previous conversation or talk about something else. If there is no previous context, just say hello and ask how they are doing."
                }
              }));
              console.log("[WebSocket] Sent response.create to initiate conversation");
            }
            break;

          case "speech.started":
            // 일시정지 상태면 무시
            if (isPausedRef.current) return;

            // 사용자 발화 시작 감지 시 AI 음성 즉시 중단 (Barge-in)
            console.log("[WebSocket] Barge-in triggered");
            stopAudio();
            setState(prev => ({ ...prev, isUserSpeaking: true }));
            break;

          case "speech.stopped":
            // 일시정지 상태면 무시
            if (isPausedRef.current) return;

            setState(prev => ({ ...prev, isUserSpeaking: false }));
            // [Fix] 사용자 발화 종료 → AI 응답 대기 타임아웃 시작
            startResponseTimeout();
            break;

          case "audio.delta":
            // 일시정지 상태면 무시
            if (isPausedRef.current) return;

            if (payload.delta) {
              const rate = payload.sample_rate || 24000;
              // [Fix] AI 응답 시작 → 응답 대기 타임아웃 취소
              clearResponseTimeout();
              // [Fix] AI Speaking 타임아웃 리셋 (3초간 오디오 없으면 상태 리셋)
              resetAiSpeakingTimeout();
              setState(prev => ({ ...prev, isAiSpeaking: true, error: null }));
              playChunk(payload.delta, rate);
            }
            break;

          case "audio.done":
            console.log("[WebSocket] Audio playback done");
            break;

          case "transcript.done":
            if (payload.transcript) {
              console.log("[AI Transcript]:", payload.transcript);
              setState(prev => ({ ...prev, aiMessage: payload.transcript || "" }));
            }
            break;

          case "user.transcript":
            if (payload.transcript) {
              console.log("[User Transcript]:", payload.transcript);
              setState(prev => ({ ...prev, userTranscript: payload.transcript || "" }));
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
            console.warn("[WebSocket] Unknown message type:", payload.type);
            break;
        }
      } catch (error) {
        console.error("[WebSocket] Parse error:", error);
      }
    },
    [playChunk, stopAudio, startResponseTimeout, clearResponseTimeout, resetAiSpeakingTimeout]
  );

  // handleMessage를 ref에 저장하여 connect의 의존성에서 제거
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
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (connectionIdRef.current !== currentConnectionId) {
          ws.close();
          return;
        }
        setState((prev) => ({ ...prev, isConnected: true, error: null, lastEvent: "open" }));
        // 소켓 연결 상태 이벤트 발송
        window.dispatchEvent(new CustomEvent("socket-status", { detail: { isConnected: true } }));
      };

      ws.onmessage = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        handleMessageRef.current?.(event);
      };

      ws.onclose = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;

        setState((prev) => ({ ...prev, isConnected: false, isReady: false, lastEvent: `close (${event.code})` }));
        // 소켓 연결 상태 이벤트 발송
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
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    // [Fix] 타임아웃 정리
    if (aiSpeakingTimeoutRef.current) {
      clearTimeout(aiSpeakingTimeoutRef.current);
    }
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    if (speakingEndTimeoutRef.current) {
      clearTimeout(speakingEndTimeoutRef.current);
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
        // 소켓 연결 상태 이벤트 발송
        window.dispatchEvent(new CustomEvent("socket-status", { detail: { isConnected: false } }));
      }, 1000);
    } else {
      // WebSocket이 이미 닫혀있으면 바로 정리
      wsRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      stopAudio();
      // 소켓 연결 상태 이벤트 발송
      window.dispatchEvent(new CustomEvent("socket-status", { detail: { isConnected: false } }));
    }
  }, [stopAudio]);

  /**
   * 오디오 청크 전송 (input_audio_chunk)
   */
  const sendAudioChunk = useCallback((audioData: Float32Array) => {
    // 일시정지 상태면 전송하지 않음
    if (isPausedRef.current) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const pcm16 = float32ToPCM16(audioData);
      let binary = "";
      const len = pcm16.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(pcm16[i]);
      }
      const base64 = btoa(binary);
      // OpenAI Realtime API 표준 타입 사용 (Backend에서 처리하는 타입)
      wsRef.current.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: base64
      }));
    }
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      // GainNode 초기화
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
    initAudio,
    toggleMute, // 외부 노출
    togglePause, // 외부 노출
  };
}
