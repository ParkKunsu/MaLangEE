/**
 * Exponential Backoff with Jitter 알고리즘
 * 재연결 시 동시 접속 폭주 방지
 */
import { WEBSOCKET_CONSTANTS } from "./constants";

export interface BackoffConfig {
  /** 초기 대기 시간 (ms) */
  initialDelay: number;
  /** 최대 대기 시간 (ms) */
  maxDelay: number;
  /** Backoff 승수 */
  multiplier: number;
  /** Jitter 비율 (0-1 사이) */
  jitterFactor: number;
}

/** 기본 Backoff 설정 */
export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelay: WEBSOCKET_CONSTANTS.RECONNECT.INITIAL_DELAY_MS,
  maxDelay: WEBSOCKET_CONSTANTS.RECONNECT.MAX_DELAY_MS,
  multiplier: WEBSOCKET_CONSTANTS.RECONNECT.BACKOFF_MULTIPLIER,
  jitterFactor: WEBSOCKET_CONSTANTS.RECONNECT.JITTER_FACTOR,
};

/**
 * Exponential Backoff 지연 시간 계산 (with Jitter)
 *
 * @param attempt - 현재 시도 횟수 (0부터 시작)
 * @param config - Backoff 설정
 * @returns 대기 시간 (ms)
 */
export const calculateBackoffDelay = (attempt: number, config: BackoffConfig = DEFAULT_BACKOFF_CONFIG): number => {
  const { initialDelay, maxDelay, multiplier, jitterFactor } = config;

  // Exponential delay 계산
  const exponentialDelay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);

  // Jitter 추가: delay ± (delay * jitterFactor)
  const jitter = exponentialDelay * jitterFactor;
  const randomJitter = (Math.random() * 2 - 1) * jitter;

  return Math.max(0, Math.round(exponentialDelay + randomJitter));
};

/**
 * Backoff 관리자 인터페이스
 */
export interface BackoffManager {
  /** 다음 대기 시간 반환 및 시도 횟수 증가 */
  nextDelay: () => number;
  /** 현재 시도 횟수 반환 */
  getAttemptCount: () => number;
  /** 최대 시도 횟수 초과 여부 */
  isMaxAttemptsReached: () => boolean;
  /** 시도 횟수 초기화 */
  reset: () => void;
}

/**
 * Backoff 관리자 생성
 */
export const createBackoffManager = (
  maxAttempts: number = WEBSOCKET_CONSTANTS.RECONNECT.MAX_ATTEMPTS,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG
): BackoffManager => {
  let attemptCount = 0;

  return {
    nextDelay: () => {
      const delay = calculateBackoffDelay(attemptCount, config);
      attemptCount++;
      return delay;
    },

    getAttemptCount: () => attemptCount,

    isMaxAttemptsReached: () => attemptCount >= maxAttempts,

    reset: () => {
      attemptCount = 0;
    },
  };
};
