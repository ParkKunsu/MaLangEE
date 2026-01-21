/**
 * WebSocket 연결 상태 머신
 * Race condition 방지를 위한 상태 전이 관리
 */
import { debugLog, debugWarn } from "@/shared/lib/debug";

/** 연결 상태 타입 */
export const ConnectionState = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  READY: "READY",
  RECONNECTING: "RECONNECTING",
  DISCONNECTING: "DISCONNECTING",
  ERROR: "ERROR",
} as const;

export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

/** 유효한 상태 전이 정의 */
const VALID_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
  DISCONNECTED: ["CONNECTING"],
  CONNECTING: ["CONNECTED", "ERROR", "DISCONNECTED"],
  CONNECTED: ["READY", "DISCONNECTING", "ERROR", "RECONNECTING"],
  READY: ["DISCONNECTING", "ERROR", "RECONNECTING"],
  RECONNECTING: ["CONNECTING", "DISCONNECTED", "ERROR"],
  DISCONNECTING: ["DISCONNECTED"],
  ERROR: ["DISCONNECTED", "RECONNECTING"],
};

/**
 * 상태 전이가 유효한지 확인
 */
export const canTransition = (from: ConnectionState, to: ConnectionState): boolean => {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
};

/** 상태 변경 리스너 타입 */
export type StateChangeListener = (state: ConnectionState, previousState: ConnectionState) => void;

/**
 * 연결 상태 머신 인터페이스
 */
export interface ConnectionStateMachine {
  /** 현재 상태 반환 */
  getState: () => ConnectionState;
  /** 상태 전이 시도 (성공 여부 반환) */
  transition: (to: ConnectionState) => boolean;
  /** 상태 변경 리스너 등록 (해제 함수 반환) */
  subscribe: (listener: StateChangeListener) => () => void;
  /** 상태 초기화 */
  reset: () => void;
  /** 연결됨 상태인지 확인 */
  isConnected: () => boolean;
  /** 준비 완료 상태인지 확인 */
  isReady: () => boolean;
}

/**
 * 연결 상태 머신 생성
 */
export const createConnectionStateMachine = (): ConnectionStateMachine => {
  let currentState: ConnectionState = ConnectionState.DISCONNECTED;
  const listeners = new Set<StateChangeListener>();

  return {
    getState: () => currentState,

    transition: (to: ConnectionState): boolean => {
      if (!canTransition(currentState, to)) {
        debugWarn(`[ConnectionStateMachine] Invalid transition: ${currentState} -> ${to}`);
        return false;
      }

      const previousState = currentState;
      currentState = to;
      debugLog(`[ConnectionStateMachine] State changed: ${previousState} -> ${to}`);

      listeners.forEach((listener) => {
        try {
          listener(currentState, previousState);
        } catch (error) {
          debugWarn(`[ConnectionStateMachine] Listener error:`, error);
        }
      });

      return true;
    },

    subscribe: (listener: StateChangeListener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    reset: () => {
      currentState = ConnectionState.DISCONNECTED;
      debugLog(`[ConnectionStateMachine] State reset to DISCONNECTED`);
    },

    isConnected: () => {
      return currentState === ConnectionState.CONNECTED || currentState === ConnectionState.READY;
    },

    isReady: () => {
      return currentState === ConnectionState.READY;
    },
  };
};
