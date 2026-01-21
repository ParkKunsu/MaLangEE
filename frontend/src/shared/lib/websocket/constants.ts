/**
 * WebSocket 관련 상수 정의
 */

export const WEBSOCKET_CONSTANTS = {
  /** 오디오 설정 */
  AUDIO: {
    /** 마이크 입력 샘플레이트 (Hz) */
    INPUT_SAMPLE_RATE: 16000,
    /** 스피커 출력 샘플레이트 (Hz) */
    OUTPUT_SAMPLE_RATE: 24000,
    /** AI 발화 종료 후 대기 시간 (ms) */
    SPEAKING_END_DELAY_MS: 500,
    /** 오디오 버퍼 크기 */
    BUFFER_SIZE: 4096,
  },

  /** 재연결 설정 */
  RECONNECT: {
    /** 초기 재연결 대기 시간 (ms) */
    INITIAL_DELAY_MS: 1000,
    /** 최대 재연결 대기 시간 (ms) */
    MAX_DELAY_MS: 10000,
    /** 최대 재연결 시도 횟수 */
    MAX_ATTEMPTS: 5,
    /** Backoff 승수 */
    BACKOFF_MULTIPLIER: 2,
    /** Jitter 비율 (0-1) */
    JITTER_FACTOR: 0.3,
  },

  /** 타임아웃 설정 */
  TIMEOUT: {
    /** 연결 해제 타임아웃 (ms) */
    DISCONNECT_MS: 5000,
    /** 인증 타임아웃 (ms) */
    AUTH_MS: 10000,
    /** 준비 완료 타임아웃 (ms) */
    READY_MS: 30000,
  },

  /** VAD (Voice Activity Detection) 설정 */
  VAD: {
    /** 음성 감지 임계값 */
    THRESHOLD: 0.5,
    /** 음성 시작 전 패딩 (ms) */
    PREFIX_PADDING_MS: 300,
    /** 무음 지속 시간 (ms) */
    SILENCE_DURATION_MS: 1000,
  },
} as const;

/** 오디오 상수 타입 */
export type AudioConstants = typeof WEBSOCKET_CONSTANTS.AUDIO;

/** 재연결 상수 타입 */
export type ReconnectConstants = typeof WEBSOCKET_CONSTANTS.RECONNECT;

/** 타임아웃 상수 타입 */
export type TimeoutConstants = typeof WEBSOCKET_CONSTANTS.TIMEOUT;

/** VAD 상수 타입 */
export type VadConstants = typeof WEBSOCKET_CONSTANTS.VAD;
