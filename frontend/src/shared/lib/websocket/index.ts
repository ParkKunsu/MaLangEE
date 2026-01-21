/**
 * WebSocket 유틸리티 Public API
 */

// 상수
export { WEBSOCKET_CONSTANTS } from "./constants";
export type { AudioConstants, ReconnectConstants, TimeoutConstants, VadConstants } from "./constants";

// URL 빌더
export {
  buildWebSocketUrl,
  buildScenarioWebSocketUrl,
  buildConversationWebSocketUrl,
  getWebSocketBaseUrl,
} from "./url-builder";
export type { WebSocketUrlConfig } from "./url-builder";

// 에러 처리
export {
  WebSocketErrorCode,
  WebSocketErrorSchema,
  createWebSocketError,
  isRecoverableError,
  getErrorMessage,
} from "./errors";
export type { WebSocketError } from "./errors";

// 연결 상태 머신
export { ConnectionState, canTransition, createConnectionStateMachine } from "./connection-state";
export type { ConnectionStateMachine, StateChangeListener } from "./connection-state";

// Backoff 알고리즘
export {
  calculateBackoffDelay,
  createBackoffManager,
  DEFAULT_BACKOFF_CONFIG,
} from "./backoff";
export type { BackoffConfig, BackoffManager } from "./backoff";
