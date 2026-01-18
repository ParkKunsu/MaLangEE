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
}

export function useConversationChatNew(sessionId: string) {
  const [state, setState] = useState<ConversationChatStateNew>({
    isConnected: false,
    isReady: false,
    logs: [],
    aiMessage: "",
    aiMessageKR: "",
    userTranscript: "",
    isAiSpeaking: false,
    isUserSpeaking: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

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
    params.append("voice", "alloy");
    params.append("show_text", "true");

    return `${wsBaseUrl}${endpoint}?${params.toString()}`;
  };

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
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
    source.connect(ctx.destination);

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
      setState(prev => ({ ...prev, isConnected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "session.created":
            addLog("Received 'session.created'. Sending init messages...");
            setState(prev => ({ ...prev, isReady: true }));
            
            // 1. Session Update
            ws.send(JSON.stringify({
              type: "session.update",
              session: {
                instructions: "You are an English conversation tutor. Speak naturally.",
                turn_detection: { type: "server_vad", threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 1000 }
              }
            }));
            addLog("Sent session.update");

            // 2. Response Create
            ws.send(JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["text", "audio"],
                instructions: "Say hello to the user."
              }
            }));
            addLog("Sent response.create");
            break;

          case "audio.delta":
            playAudio(data.delta, 24000);
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

  }, [playAudio, stopAudio, sessionId]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    stopAudio();
    audioContextRef.current?.close();
    audioContextRef.current = null;
    addLog("Disconnected manually");
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

      // 2. 응답 생성 요청 (강제 트리거)
      wsRef.current.send(JSON.stringify({ type: "response.create" }));
      addLog("Sent response.create (after text)");
    }
  }, []);

  return {
    state,
    connect,
    disconnect,
    initAudio,
    sendAudio,
    sendText
  };
}
