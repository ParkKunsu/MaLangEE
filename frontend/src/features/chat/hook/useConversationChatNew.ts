"use client";

import { useState, useCallback, useRef } from "react";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";

export interface ConversationChatStateNew {
  isConnected: boolean;
  isReady: boolean;
  logs: string[];
  aiMessage: string;
  aiMessageKR: string;
  userTranscript: string;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  sessionReport: any | null;
}

export function useConversationChatNew(sessionId: string, voice: string = "alloy") {
  const [state, setState] = useState<ConversationChatStateNew>({
    isConnected: false,
    isReady: false,
    logs: [],
    aiMessage: "",
    aiMessageKR: "",
    userTranscript: "",
    isAiSpeaking: false,
    isUserSpeaking: false,
    sessionReport: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const addLog = (msg: string) => {
    setState((prev) => ({ ...prev, logs: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.logs] }));
  };

  const getWebSocketUrl = () => {
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
    params.append("voice", voice); // 전달받은 voice 사용
    params.append("show_text", "true");

    return `${wsBaseUrl}${endpoint}?${params.toString()}`;
  };

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      addLog("AudioContext created");
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
      addLog("AudioContext resumed");
    }
  }, []);

  const playAudio = useCallback((base64: string, sampleRate: number = 24000) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const samples = new Float32Array(Math.floor(bytes.length / 2));
    for (let i = 0; i < samples.length; i++) {
      let sample = (bytes[i * 2 + 1] << 8) | bytes[i * 2];
      if (sample >= 0x8000) sample -= 0x10000;
      samples[i] = sample / 32768;
    }

    const buffer = ctx.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);

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
    setState(prev => ({ ...prev, isAiSpeaking: true }));

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setTimeout(() => {
            setState(prev => ({ ...prev, isAiSpeaking: false }));
        }, 500);
      }
    };
  }, []);

  const stopAudio = useCallback(() => {
    activeSourcesRef.current.forEach(s => s.stop());
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setState(prev => ({ ...prev, isAiSpeaking: false }));
  }, []);

  const toggleMute = useCallback((isMuted: boolean) => {
    if (gainNodeRef.current && audioContextRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(currentTime);
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : 1, currentTime + 0.1);
      addLog(isMuted ? "Muted" : "Unmuted");
    }
  }, []);

  const connect = useCallback(() => {
    const url = getWebSocketUrl();
    if (!url) {
      addLog("Session ID is missing");
      return;
    }
    addLog(`Connecting to ${url}`);
    
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog("WebSocket Connected");
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "session.update":
            addLog("Received 'session.update'. Sending init messages...");
            setState(prev => ({ ...prev, isReady: true }));
            
            // 1. Session Update (문서 기준: config 필드 사용, 불필요한 파라미터 제거)
            ws.send(JSON.stringify({
              type: "session.update",
              config: {
                voice: voice // voice 설정만 전송
              }
            }));
            addLog("Sent session.update (config)");
            break;

          case "audio.delta":
            playAudio(data.delta, 24000);
            break;

          case "audio.done":
            addLog("AI audio stream completed");
            break;

          case "transcript.done":
            setState(prev => ({ ...prev, aiMessage: data.transcript }));
            addLog(`AI: ${data.transcript}`);
            // 번역 수행
            translateToKorean(data.transcript).then(translated => {
              setState(prev => ({ ...prev, aiMessageKR: translated }));
              addLog(`AI (KR): ${translated}`);
            });
            break;

          case "speech.started":
            addLog("User speech started (VAD)");
            stopAudio();
            setState(prev => ({ ...prev, isUserSpeaking: true }));
            break;
          
          case "speech.stopped":
            addLog("User speech stopped (VAD)");
            setState(prev => ({ ...prev, isUserSpeaking: false }));
            break;

          case "user.transcript":
            setState(prev => ({ ...prev, userTranscript: data.transcript }));
            addLog(`User: ${data.transcript}`);
            break;

          case "disconnected":
            addLog(`Session disconnected: ${data.reason || "Unknown"}`);
            if (data.report) {
              setState(prev => ({ ...prev, sessionReport: data.report }));
              addLog(`Session report received: ${JSON.stringify(data.report)}`);
            }
            break;

          case "error":
            addLog(`Error: ${data.message}`);
            break;
        }
      } catch (e) {
        addLog(`Parse Error: ${e}`);
      }
    };

    ws.onclose = (e) => {
      addLog(`WebSocket Closed: ${e.code} ${e.reason}`);
      setState(prev => ({ ...prev, isConnected: false, isReady: false }));
    };

    ws.onerror = (e) => {
      addLog("WebSocket Error");
    };

  }, [playAudio, stopAudio, sessionId, voice]); // voice 의존성 추가

  const disconnect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // 서버에 disconnect 메시지를 보내서 리포트를 받음
      wsRef.current.send(JSON.stringify({ type: "disconnect" }));
      addLog("Sent disconnect request");
    }
    stopAudio();
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, [stopAudio]);

  const sendAudio = useCallback((float32Data: Float32Array) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const buffer = new ArrayBuffer(float32Data.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < float32Data.length; i++) {
        let s = Math.max(-1, Math.min(1, float32Data[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(i * 2, s, true);
      }
      
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      wsRef.current.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: base64
      }));
    }
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // 1. 텍스트 메시지 전송
      wsRef.current.send(JSON.stringify({ type: "text", text }));
      addLog(`Sent Text: ${text}`);

      // 2. 응답 생성 요청 (문서 기준: 파라미터 없음)
      wsRef.current.send(JSON.stringify({ type: "response.create" }));
      addLog("Sent response.create (after text)");
    }
  }, []);

  const commitAudio = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      addLog("Sent input_audio_buffer.commit");
    }
  }, []);

  const updateVoice = useCallback((newVoice: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "session.update",
        config: {
          voice: newVoice
        }
      }));
      addLog(`Sent session.update with voice: ${newVoice}`);
    }
  }, []);

  const requestResponse = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "response.create" }));
      addLog("Sent response.create (manual trigger)");
    }
  }, []);

  return {
    state,
    connect,
    disconnect,
    initAudio,
    sendAudio,
    sendText,
    commitAudio,
    updateVoice,
    requestResponse,
    toggleMute,
  };
}
