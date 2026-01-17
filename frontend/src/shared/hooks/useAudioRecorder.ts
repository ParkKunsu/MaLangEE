import { useCallback, useRef, useState, useEffect } from "react";

interface UseAudioRecorderProps {
  onAudioData: (data: Float32Array) => void;
  onVolumeChange?: (volume: number) => void;
  sampleRate?: number;
}

export function useAudioRecorder({
  onAudioData,
  onVolumeChange,
  sampleRate = 24000, // 기본값: OpenAI Realtime API 표준 (24kHz)
}: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startRecording = useCallback(async () => {
    if (streamRef.current) return;

    const getMediaStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
      }
      const legacyApi =
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia;
      if (legacyApi) {
        return new Promise((resolve, reject) => {
          legacyApi.call(navigator, constraints, resolve, reject);
        });
      }
      throw new Error("MEDIA_API_NOT_SUPPORTED");
    };

    try {
      const constraints = {
        audio: {
          sampleRate: { ideal: sampleRate },
          channelCount: { ideal: 1 },
          echoCancellation: true,
          noiseSuppression: true,
        },
      };

      let stream: MediaStream;
      try {
        stream = await getMediaStream(constraints);
      } catch (err) {
        console.warn("[Recording] Preferred constraints failed. Trying basic fallback...", err);
        stream = await getMediaStream({ audio: true });
      }

      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // 볼륨 계산 (RMS)
        if (onVolumeChange) {
          let sum = 0;
          for (let i = 0; i < inputData.length; i += 10) { // 성능을 위해 샘플링
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / (inputData.length / 10));
          onVolumeChange(rms);
        }

        // 데이터 복사 및 전달
        const float32Data = new Float32Array(inputData);
        onAudioData(float32Data);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      sourceRef.current = source;
      processorRef.current = processor;
      setIsRecording(true);

    } catch (error) {
      console.error("[Recording] Failed to start:", error);
      if (
        error instanceof Error &&
        (error.message === "MEDIA_API_NOT_SUPPORTED" || error.name === "NotAllowedError")
      ) {
        alert(
          "마이크를 사용할 수 없습니다.\nHTTPS 연결(또는 localhost)인지 확인하거나 마이크 권한을 허용해주세요."
        );
      }
      stopRecording();
    }
  }, [onAudioData, onVolumeChange, sampleRate]);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}
