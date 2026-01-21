import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateBackoffDelay,
  createBackoffManager,
  DEFAULT_BACKOFF_CONFIG,
} from "./backoff";

describe("backoff", () => {
  describe("DEFAULT_BACKOFF_CONFIG", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_BACKOFF_CONFIG.initialDelay).toBe(1000);
      expect(DEFAULT_BACKOFF_CONFIG.maxDelay).toBe(10000);
      expect(DEFAULT_BACKOFF_CONFIG.multiplier).toBe(2);
      expect(DEFAULT_BACKOFF_CONFIG.jitterFactor).toBe(0.3);
    });
  });

  describe("calculateBackoffDelay", () => {
    beforeEach(() => {
      // Mock Math.random to return consistent values for testing
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should calculate correct base delay for attempt 0", () => {
      const config = { ...DEFAULT_BACKOFF_CONFIG, jitterFactor: 0 };
      const delay = calculateBackoffDelay(0, config);

      expect(delay).toBe(1000); // initialDelay * 2^0 = 1000
    });

    it("should calculate correct base delay for attempt 1", () => {
      const config = { ...DEFAULT_BACKOFF_CONFIG, jitterFactor: 0 };
      const delay = calculateBackoffDelay(1, config);

      expect(delay).toBe(2000); // initialDelay * 2^1 = 2000
    });

    it("should calculate correct base delay for attempt 2", () => {
      const config = { ...DEFAULT_BACKOFF_CONFIG, jitterFactor: 0 };
      const delay = calculateBackoffDelay(2, config);

      expect(delay).toBe(4000); // initialDelay * 2^2 = 4000
    });

    it("should cap delay at maxDelay", () => {
      const config = { ...DEFAULT_BACKOFF_CONFIG, jitterFactor: 0 };
      const delay = calculateBackoffDelay(10, config);

      expect(delay).toBe(10000); // Should be capped at maxDelay
    });

    it("should add jitter to delay", () => {
      // With Math.random() = 0.5, jitter should be 0
      // (0.5 * 2 - 1) * jitter = 0
      const delay = calculateBackoffDelay(0, DEFAULT_BACKOFF_CONFIG);

      expect(delay).toBe(1000);
    });

    it("should handle positive jitter", () => {
      vi.spyOn(Math, "random").mockReturnValue(1); // Max positive jitter
      const delay = calculateBackoffDelay(0, DEFAULT_BACKOFF_CONFIG);

      // (1 * 2 - 1) * (1000 * 0.3) = 300
      expect(delay).toBe(1300);
    });

    it("should handle negative jitter", () => {
      vi.spyOn(Math, "random").mockReturnValue(0); // Max negative jitter
      const delay = calculateBackoffDelay(0, DEFAULT_BACKOFF_CONFIG);

      // (0 * 2 - 1) * (1000 * 0.3) = -300
      expect(delay).toBe(700);
    });

    it("should never return negative delay", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const config = { ...DEFAULT_BACKOFF_CONFIG, jitterFactor: 2 }; // Extreme jitter
      const delay = calculateBackoffDelay(0, config);

      expect(delay).toBeGreaterThanOrEqual(0);
    });
  });

  describe("createBackoffManager", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should start with attempt count 0", () => {
      const manager = createBackoffManager();
      expect(manager.getAttemptCount()).toBe(0);
    });

    it("should increment attempt count on nextDelay", () => {
      const manager = createBackoffManager();

      manager.nextDelay();
      expect(manager.getAttemptCount()).toBe(1);

      manager.nextDelay();
      expect(manager.getAttemptCount()).toBe(2);
    });

    it("should return increasing delays", () => {
      const config = { ...DEFAULT_BACKOFF_CONFIG, jitterFactor: 0 };
      const manager = createBackoffManager(5, config);

      const delay1 = manager.nextDelay();
      const delay2 = manager.nextDelay();
      const delay3 = manager.nextDelay();

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    it("should correctly report max attempts reached", () => {
      const manager = createBackoffManager(3);

      expect(manager.isMaxAttemptsReached()).toBe(false);

      manager.nextDelay();
      manager.nextDelay();
      manager.nextDelay();

      expect(manager.isMaxAttemptsReached()).toBe(true);
    });

    it("should reset attempt count", () => {
      const manager = createBackoffManager();

      manager.nextDelay();
      manager.nextDelay();
      expect(manager.getAttemptCount()).toBe(2);

      manager.reset();
      expect(manager.getAttemptCount()).toBe(0);
      expect(manager.isMaxAttemptsReached()).toBe(false);
    });

    it("should use default max attempts from constants", () => {
      const manager = createBackoffManager();

      for (let i = 0; i < 5; i++) {
        manager.nextDelay();
      }

      expect(manager.isMaxAttemptsReached()).toBe(true);
    });
  });
});
