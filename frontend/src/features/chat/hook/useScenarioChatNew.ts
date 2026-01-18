"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { tokenStorage } from "@/features/auth";
import { translateToKorean } from "@/shared/lib/translate";

export interface ScenarioChatStateNew {
  isConnected: boolean;
  isReady: boolean;
  logs: string[];
  aiMessage: string;
  aiMessageKR: string;
  userTranscript: string;
  isAiSpeaking: boolean;
  scenarioResult: any | null;
}

export function useScenarioChatNew() {
  const [state, setState] = useState<ScenarioChatStateNew>({
    isConnected: false,
    isReady: false,
    logs: [],
    aiMessage: "",
    aiMessageKR: "",
    userTranscript: "",
    isAiSpeaking: false,
    scenarioResult: null,
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
  };

  // 샘플 레이트 24000Hz로 통일
  const SAMPLE_RATE = 24000;

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: SAMPLE_RATE });
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      addLog(`AudioContext created (${SAMPLE_RATE}Hz)`);
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
          case "ready":
            addLog("Received 'ready'.");
            setState(prev => ({ ...prev, isReady: true }));

            break;

          case "response.audio.delta":
            playAudio(data.delta, data.sample_rate || 24000);
            break;

          case "response.audio.done":
            addLog("AI audio stream completed");
            break;

          case "response.audio_transcript.delta":
            if (data.transcript_delta) {
              setState(prev => ({
                ...prev,
                aiMessage: prev.aiMessage + data.transcript_delta
              }));
              addLog(`AI (delta): ${data.transcript_delta}`);
            }
            break;

          case "response.audio_transcript.done":
            setState(prev => ({ ...prev, aiMessage: data.transcript }));
            addLog(`AI: ${data.transcript}`);
            translateToKorean(data.transcript).then(translated => {
              setState(prev => ({ ...prev, aiMessageKR: translated }));
              addLog(`AI (KR): ${translated}`);
            });
            break;

          case "input_audio.transcript":
            if (data.transcript) {
              setState(prev => ({ ...prev, userTranscript: data.transcript }));
              addLog(`User: ${data.transcript}`);
            }
            break;

          case "scenario.completed":
            addLog(`Scenario Completed: ${JSON.stringify(data.json)}`);
            setState(prev => ({ ...prev, scenarioResult: data.json }));
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

  }, [playAudio, stopAudio]);

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
        type: "input_audio_chunk",
        audio: base64,
        sample_rate: 24000 // 24000으로 변경
      }));
    }
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text }));
      addLog(`Sent Text: ${text}`);
    }
  }, []);

  const clearAudioBuffer = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input_audio_clear" }));
      addLog("Sent input_audio_clear");
    }
  }, []);

  const commitAudio = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input_audio_commit" }));
      addLog("Sent input_audio_commit");
    }
  }, []);

  return {
    state,
    connect,
    disconnect,
    initAudio,
    sendAudio,
    sendText,
    toggleMute,
    clearAudioBuffer,
    commitAudio,
  };
}
