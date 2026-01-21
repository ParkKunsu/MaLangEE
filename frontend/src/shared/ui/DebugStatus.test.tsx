import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DebugStatus } from "./DebugStatus";

// Mock isDev
let mockIsDev = true;
vi.mock("@/shared/lib/debug", () => ({
  isDev: () => mockIsDev,
}));

describe("DebugStatus", () => {
  beforeEach(() => {
    mockIsDev = true;
  });

  it("should return null in production", () => {
    mockIsDev = false;

    const { container } = render(
      <DebugStatus isConnected={true} lastEvent={null} isAiSpeaking={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render in development", () => {
    const { container } = render(
      <DebugStatus isConnected={true} lastEvent={null} isAiSpeaking={false} />
    );

    expect(container.firstChild).not.toBeNull();
  });

  it("should show CONNECTED when connected", () => {
    render(
      <DebugStatus isConnected={true} lastEvent={null} isAiSpeaking={false} />
    );

    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
  });

  it("should show DISCONNECTED when not connected", () => {
    render(
      <DebugStatus isConnected={false} lastEvent={null} isAiSpeaking={false} />
    );

    expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
  });

  it("should show READY when isReady is true", () => {
    render(
      <DebugStatus
        isConnected={true}
        isReady={true}
        lastEvent={null}
        isAiSpeaking={false}
      />
    );

    expect(screen.getByText("READY")).toBeInTheDocument();
  });

  it("should show NOT READY when isReady is false", () => {
    render(
      <DebugStatus
        isConnected={true}
        isReady={false}
        lastEvent={null}
        isAiSpeaking={false}
      />
    );

    expect(screen.getByText("NOT READY")).toBeInTheDocument();
  });

  it("should show MIC ON when recording", () => {
    render(
      <DebugStatus
        isConnected={true}
        isRecording={true}
        lastEvent={null}
        isAiSpeaking={false}
      />
    );

    expect(screen.getByText("MIC ON")).toBeInTheDocument();
  });

  it("should show MIC OFF when not recording", () => {
    render(
      <DebugStatus
        isConnected={true}
        isRecording={false}
        lastEvent={null}
        isAiSpeaking={false}
      />
    );

    expect(screen.getByText("MIC OFF")).toBeInTheDocument();
  });

  it("should show MUTED when muted", () => {
    render(
      <DebugStatus
        isConnected={true}
        isMuted={true}
        lastEvent={null}
        isAiSpeaking={false}
      />
    );

    expect(screen.getByText("🔇 MUTED")).toBeInTheDocument();
  });

  it("should show last event", () => {
    render(
      <DebugStatus
        isConnected={true}
        lastEvent="session.created"
        isAiSpeaking={false}
      />
    );

    expect(screen.getByText("SESSION.CREATED")).toBeInTheDocument();
  });

  it("should show AI SPEAKING when AI is speaking", () => {
    render(
      <DebugStatus isConnected={true} lastEvent={null} isAiSpeaking={true} />
    );

    expect(screen.getByText("🔊 AI SPEAKING")).toBeInTheDocument();
  });

  it("should show USER SPEAKING when user is speaking", () => {
    render(
      <DebugStatus
        isConnected={true}
        lastEvent={null}
        isAiSpeaking={false}
        isUserSpeaking={true}
      />
    );

    expect(screen.getByText("🎤 USER SPEAKING")).toBeInTheDocument();
  });

  it("should show user transcript", () => {
    render(
      <DebugStatus
        isConnected={true}
        lastEvent={null}
        isAiSpeaking={false}
        userTranscript="Hello world"
      />
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("YOU:")).toBeInTheDocument();
  });

  it("should not show user transcript when empty", () => {
    render(
      <DebugStatus
        isConnected={true}
        lastEvent={null}
        isAiSpeaking={false}
        userTranscript=""
      />
    );

    expect(screen.queryByText("YOU:")).not.toBeInTheDocument();
  });

  it("should have pointer-events-none class", () => {
    const { container } = render(
      <DebugStatus isConnected={true} lastEvent={null} isAiSpeaking={false} />
    );

    expect(container.firstChild).toHaveClass("pointer-events-none");
  });

  it("should have fixed positioning", () => {
    const { container } = render(
      <DebugStatus isConnected={true} lastEvent={null} isAiSpeaking={false} />
    );

    expect(container.firstChild).toHaveClass("fixed");
  });
});
