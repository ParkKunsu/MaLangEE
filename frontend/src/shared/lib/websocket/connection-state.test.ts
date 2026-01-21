import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ConnectionState,
  canTransition,
  createConnectionStateMachine,
} from "./connection-state";

// Mock debug module
vi.mock("@/shared/lib/debug", () => ({
  debugLog: vi.fn(),
  debugWarn: vi.fn(),
}));

describe("connection-state", () => {
  describe("ConnectionState", () => {
    it("should have all expected states", () => {
      expect(ConnectionState.DISCONNECTED).toBe("DISCONNECTED");
      expect(ConnectionState.CONNECTING).toBe("CONNECTING");
      expect(ConnectionState.CONNECTED).toBe("CONNECTED");
      expect(ConnectionState.READY).toBe("READY");
      expect(ConnectionState.RECONNECTING).toBe("RECONNECTING");
      expect(ConnectionState.DISCONNECTING).toBe("DISCONNECTING");
      expect(ConnectionState.ERROR).toBe("ERROR");
    });
  });

  describe("canTransition", () => {
    it("should allow valid transitions from DISCONNECTED", () => {
      expect(canTransition("DISCONNECTED", "CONNECTING")).toBe(true);
      expect(canTransition("DISCONNECTED", "CONNECTED")).toBe(false);
    });

    it("should allow valid transitions from CONNECTING", () => {
      expect(canTransition("CONNECTING", "CONNECTED")).toBe(true);
      expect(canTransition("CONNECTING", "ERROR")).toBe(true);
      expect(canTransition("CONNECTING", "DISCONNECTED")).toBe(true);
      expect(canTransition("CONNECTING", "READY")).toBe(false);
    });

    it("should allow valid transitions from CONNECTED", () => {
      expect(canTransition("CONNECTED", "READY")).toBe(true);
      expect(canTransition("CONNECTED", "DISCONNECTING")).toBe(true);
      expect(canTransition("CONNECTED", "ERROR")).toBe(true);
      expect(canTransition("CONNECTED", "RECONNECTING")).toBe(true);
    });

    it("should allow valid transitions from READY", () => {
      expect(canTransition("READY", "DISCONNECTING")).toBe(true);
      expect(canTransition("READY", "ERROR")).toBe(true);
      expect(canTransition("READY", "RECONNECTING")).toBe(true);
      expect(canTransition("READY", "CONNECTING")).toBe(false);
    });

    it("should allow valid transitions from RECONNECTING", () => {
      expect(canTransition("RECONNECTING", "CONNECTING")).toBe(true);
      expect(canTransition("RECONNECTING", "DISCONNECTED")).toBe(true);
      expect(canTransition("RECONNECTING", "ERROR")).toBe(true);
    });

    it("should allow valid transitions from DISCONNECTING", () => {
      expect(canTransition("DISCONNECTING", "DISCONNECTED")).toBe(true);
      expect(canTransition("DISCONNECTING", "CONNECTING")).toBe(false);
    });

    it("should allow valid transitions from ERROR", () => {
      expect(canTransition("ERROR", "DISCONNECTED")).toBe(true);
      expect(canTransition("ERROR", "RECONNECTING")).toBe(true);
      expect(canTransition("ERROR", "CONNECTING")).toBe(false);
    });
  });

  describe("createConnectionStateMachine", () => {
    let stateMachine: ReturnType<typeof createConnectionStateMachine>;

    beforeEach(() => {
      stateMachine = createConnectionStateMachine();
    });

    it("should initialize with DISCONNECTED state", () => {
      expect(stateMachine.getState()).toBe("DISCONNECTED");
    });

    it("should transition to valid states", () => {
      expect(stateMachine.transition("CONNECTING")).toBe(true);
      expect(stateMachine.getState()).toBe("CONNECTING");

      expect(stateMachine.transition("CONNECTED")).toBe(true);
      expect(stateMachine.getState()).toBe("CONNECTED");

      expect(stateMachine.transition("READY")).toBe(true);
      expect(stateMachine.getState()).toBe("READY");
    });

    it("should reject invalid transitions", () => {
      expect(stateMachine.transition("READY")).toBe(false);
      expect(stateMachine.getState()).toBe("DISCONNECTED");
    });

    it("should notify listeners on state change", () => {
      const listener = vi.fn();
      stateMachine.subscribe(listener);

      stateMachine.transition("CONNECTING");

      expect(listener).toHaveBeenCalledWith("CONNECTING", "DISCONNECTED");
    });

    it("should allow unsubscribing listeners", () => {
      const listener = vi.fn();
      const unsubscribe = stateMachine.subscribe(listener);

      unsubscribe();
      stateMachine.transition("CONNECTING");

      expect(listener).not.toHaveBeenCalled();
    });

    it("should reset state to DISCONNECTED", () => {
      stateMachine.transition("CONNECTING");
      stateMachine.transition("CONNECTED");

      stateMachine.reset();

      expect(stateMachine.getState()).toBe("DISCONNECTED");
    });

    it("should correctly report isConnected", () => {
      expect(stateMachine.isConnected()).toBe(false);

      stateMachine.transition("CONNECTING");
      expect(stateMachine.isConnected()).toBe(false);

      stateMachine.transition("CONNECTED");
      expect(stateMachine.isConnected()).toBe(true);

      stateMachine.transition("READY");
      expect(stateMachine.isConnected()).toBe(true);
    });

    it("should correctly report isReady", () => {
      expect(stateMachine.isReady()).toBe(false);

      stateMachine.transition("CONNECTING");
      stateMachine.transition("CONNECTED");
      expect(stateMachine.isReady()).toBe(false);

      stateMachine.transition("READY");
      expect(stateMachine.isReady()).toBe(true);
    });

    it("should handle listener errors gracefully", () => {
      const errorListener = vi.fn(() => {
        throw new Error("Listener error");
      });
      const normalListener = vi.fn();

      stateMachine.subscribe(errorListener);
      stateMachine.subscribe(normalListener);

      // Should not throw
      expect(() => stateMachine.transition("CONNECTING")).not.toThrow();

      // Normal listener should still be called
      expect(normalListener).toHaveBeenCalled();
    });
  });
});
