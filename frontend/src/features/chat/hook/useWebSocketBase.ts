"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { debugLog } from "@/shared/lib/debug";
import { WEBSOCKET_CONSTANTS, calculateBackoffDelay } from "@/shared/lib/websocket";

export interface UseWebSocketBaseConfig {
  getWebSocketUrl: () => string;
  onMessage: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  autoConnect?: boolean;
  maxReconnectAttempts?: number;
}

export function useWebSocketBase({
  getWebSocketUrl,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoConnect = true,
  maxReconnectAttempts = WEBSOCKET_CONSTANTS.RECONNECT.MAX_ATTEMPTS,
}: UseWebSocketBaseConfig) {
  // 상태 관리
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const speakingEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const connectionIdRef = useRef(0);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManuallyClosedRef = useRef(false);

  // Callback refs for stable references
  const getWebSocketUrlRef = useRef(getWebSocketUrl);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    getWebSocketUrlRef.current = getWebSocketUrl;
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  });

  // 로그 추가 함수 - 안정적인 참조를 위해 ref 사용
  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }, []);

  // 오디오 초기화
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: WEBSOCKET_CONSTANTS.AUDIO.OUTPUT_SAMPLE_RATE });
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      addLog("AudioContext created");
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
      addLog("AudioContext resumed");
    }
  }, [addLog]);

  // 오디오 재생 중지
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
    setIsAiSpeaking(false);
  }, []);

  // 오디오 재생
  const playAudioChunk = useCallback((base64: string, sampleRate: number = 24000) => {
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
    setIsAiSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        if (speakingEndTimeoutRef.current) clearTimeout(speakingEndTimeoutRef.current);
        speakingEndTimeoutRef.current = setTimeout(() => {
          setIsAiSpeaking(false);
          speakingEndTimeoutRef.current = null;
        }, WEBSOCKET_CONSTANTS.AUDIO.SPEAKING_END_DELAY_MS);
      }
    };
  }, []);

  // 오디오 전송 데이터 변환 (Float32 -> Base64 PCM16)
  const encodeAudio = useCallback((float32Data: Float32Array): string => {
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
    return btoa(binary);
  }, []);

  // 음소거 토글
  const toggleMute = useCallback((isMuted: boolean) => {
    if (gainNodeRef.current && audioContextRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(currentTime);
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : 1, currentTime + 0.1);
      addLog(isMuted ? "Muted" : "Unmuted");
    }
  }, [addLog]);

  // 마이크 시작
  const startMicrophone = useCallback(async (onAudioData: (data: Float32Array) => void) => {
    try {
      // 1. 마이크 권한 획득
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 24000 }
      });
      streamRef.current = stream;

      // 2. AudioContext 재사용 (없으면 initAudio 호출)
      if (!audioContextRef.current) {
        initAudio();
      }

      // 3. AudioContext resume
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (!audioContextRef.current) {
        throw new Error("AudioContext initialization failed");
      }

      // 4. AudioProcessor 생성 및 연결
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(WEBSOCKET_CONSTANTS.AUDIO.BUFFER_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        onAudioData(inputData);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      setIsRecording(true);
      addLog("Microphone started");
    } catch (error) {
      addLog(`Microphone error: ${error}`);
      throw error;
    }
  }, [initAudio, addLog]);

  // 마이크 중지
  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    setIsRecording(false);
    addLog("Microphone stopped");
  }, [addLog]);

  // WebSocket 연결
  const connect = useCallback(() => {
    const currentConnectionId = ++connectionIdRef.current;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    isManuallyClosedRef.current = false;
    const url = getWebSocketUrlRef.current();

    if (!url) {
      addLog("WebSocket URL is empty");
      return;
    }

    addLog(`Connecting to ${url}`);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (connectionIdRef.current !== currentConnectionId) {
          ws.close();
          return;
        }
        debugLog("[WebSocket] ✅ Connection opened successfully");
        addLog("WebSocket Connected");
        setIsConnected(true);
        reconnectCountRef.current = 0;
        onOpenRef.current?.();
        debugLog("[WebSocket] Waiting for session.update or ready event...");
      };

      ws.onmessage = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        onMessageRef.current(event);
      };

      ws.onclose = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        addLog(`WebSocket Closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        setIsReady(false);
        wsRef.current = null;
        onCloseRef.current?.(event);

        if (!isManuallyClosedRef.current && reconnectCountRef.current < maxReconnectAttempts) {
          const delay = calculateBackoffDelay(reconnectCountRef.current);
          addLog(`Reconnecting in ${delay}ms...`);
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (event) => {
        if (connectionIdRef.current !== currentConnectionId) return;
        addLog("WebSocket Error");
        onErrorRef.current?.(event);
      };

      wsRef.current = ws;
    } catch (error) {
      addLog(`Connection Failed: ${error}`);
    }
  }, [maxReconnectAttempts, addLog]);

  // 연결 해제
  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    // 마이크 중지
    stopMicrophone();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    stopAudio();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsReady(false);
    addLog("Disconnected manually");
  }, [stopAudio, stopMicrophone, addLog]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        isManuallyClosedRef.current = true;
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  // 함수들을 dependency에 포함하면 무한 루프가 발생하므로 상태값만 포함
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({
    wsRef,
    audioContextRef,
    isConnected,
    isReady,
    setIsReady,
    logs,
    addLog,
    isAiSpeaking,
    setIsAiSpeaking,
    isUserSpeaking,
    setIsUserSpeaking,
    isRecording,
    connect,
    disconnect,
    initAudio,
    playAudioChunk,
    stopAudio,
    encodeAudio,
    toggleMute,
    startMicrophone,
    stopMicrophone,
  }), [
    isConnected,
    isReady,
    logs,
    isAiSpeaking,
    isUserSpeaking,
    isRecording,
  ]);
}
