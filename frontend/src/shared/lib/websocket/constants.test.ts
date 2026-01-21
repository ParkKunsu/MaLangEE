import { describe, it, expect } from "vitest";
import { WEBSOCKET_CONSTANTS } from "./constants";

describe("WEBSOCKET_CONSTANTS", () => {
  describe("AUDIO", () => {
    it("should have correct audio sample rates", () => {
      expect(WEBSOCKET_CONSTANTS.AUDIO.INPUT_SAMPLE_RATE).toBe(16000);
      expect(WEBSOCKET_CONSTANTS.AUDIO.OUTPUT_SAMPLE_RATE).toBe(24000);
    });

    it("should have correct audio buffer settings", () => {
      expect(WEBSOCKET_CONSTANTS.AUDIO.BUFFER_SIZE).toBe(4096);
      expect(WEBSOCKET_CONSTANTS.AUDIO.SPEAKING_END_DELAY_MS).toBe(500);
    });
  });

  describe("RECONNECT", () => {
    it("should have correct reconnection settings", () => {
      expect(WEBSOCKET_CONSTANTS.RECONNECT.INITIAL_DELAY_MS).toBe(1000);
      expect(WEBSOCKET_CONSTANTS.RECONNECT.MAX_DELAY_MS).toBe(10000);
      expect(WEBSOCKET_CONSTANTS.RECONNECT.MAX_ATTEMPTS).toBe(5);
      expect(WEBSOCKET_CONSTANTS.RECONNECT.BACKOFF_MULTIPLIER).toBe(2);
      expect(WEBSOCKET_CONSTANTS.RECONNECT.JITTER_FACTOR).toBe(0.3);
    });
  });

  describe("TIMEOUT", () => {
    it("should have correct timeout settings", () => {
      expect(WEBSOCKET_CONSTANTS.TIMEOUT.DISCONNECT_MS).toBe(5000);
      expect(WEBSOCKET_CONSTANTS.TIMEOUT.AUTH_MS).toBe(10000);
      expect(WEBSOCKET_CONSTANTS.TIMEOUT.READY_MS).toBe(30000);
    });
  });

  describe("VAD", () => {
    it("should have correct VAD settings", () => {
      expect(WEBSOCKET_CONSTANTS.VAD.THRESHOLD).toBe(0.5);
      expect(WEBSOCKET_CONSTANTS.VAD.PREFIX_PADDING_MS).toBe(300);
      expect(WEBSOCKET_CONSTANTS.VAD.SILENCE_DURATION_MS).toBe(1000);
    });
  });

  it("should have all expected keys", () => {
    // as const는 TypeScript 레벨에서만 불변이며 런타임에서는 수정 가능
    // 대신 모든 키가 존재하는지 확인
    expect(WEBSOCKET_CONSTANTS).toHaveProperty("AUDIO");
    expect(WEBSOCKET_CONSTANTS).toHaveProperty("RECONNECT");
    expect(WEBSOCKET_CONSTANTS).toHaveProperty("TIMEOUT");
    expect(WEBSOCKET_CONSTANTS).toHaveProperty("VAD");
  });
});
