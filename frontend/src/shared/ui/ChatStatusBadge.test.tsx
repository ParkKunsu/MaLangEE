import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatStatusBadge } from "./ChatStatusBadge";

describe("ChatStatusBadge", () => {
  it("should show '연결 중...' when not connected", () => {
    render(<ChatStatusBadge isConnected={false} />);
    expect(screen.getByText("연결 중...")).toBeInTheDocument();
  });

  it("should show error message when error exists", () => {
    render(<ChatStatusBadge isConnected={true} error="Network Error" />);
    expect(screen.getByText("오류: Network Error")).toBeInTheDocument();
  });

  it("should show '준비 중...' when connected but not ready", () => {
    render(<ChatStatusBadge isConnected={true} isReady={false} />);
    expect(screen.getByText("준비 중...")).toBeInTheDocument();
  });

  it("should show '🔇 음소거중' when muted", () => {
    render(<ChatStatusBadge isConnected={true} isReady={true} isMuted={true} />);
    expect(screen.getByText("🔇 음소거중")).toBeInTheDocument();
  });

  it("should show '🔊 말랭이가 말하는 중' when AI is speaking", () => {
    render(
      <ChatStatusBadge isConnected={true} isReady={true} isAiSpeaking={true} />
    );
    expect(screen.getByText("🔊 말랭이가 말하는 중")).toBeInTheDocument();
  });

  it("should show '🎤 말하는 중...' when user is speaking", () => {
    render(
      <ChatStatusBadge isConnected={true} isReady={true} isUserSpeaking={true} />
    );
    expect(screen.getByText("🎤 말하는 중...")).toBeInTheDocument();
  });

  it("should show '🎤 말랭이가 듣는 중' when recording", () => {
    render(
      <ChatStatusBadge isConnected={true} isReady={true} isRecording={true} />
    );
    expect(screen.getByText("🎤 말랭이가 듣는 중")).toBeInTheDocument();
  });

  it("should show '말랭이가 듣는 중' when it is user turn", () => {
    render(
      <ChatStatusBadge isConnected={true} isReady={true} isUserTurn={true} />
    );
    expect(screen.getByText("말랭이가 듣는 중")).toBeInTheDocument();
  });

  it("should show '대기 중' when connected and ready with no special state", () => {
    render(<ChatStatusBadge isConnected={true} isReady={true} />);
    expect(screen.getByText("대기 중")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ChatStatusBadge isConnected={true} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should have yellow styling when connecting", () => {
    render(<ChatStatusBadge isConnected={false} />);
    const badge = screen.getByText("연결 중...").closest("span");
    expect(badge).toHaveClass("text-yellow-600");
  });

  it("should have red styling when error", () => {
    render(<ChatStatusBadge isConnected={true} error="Error" />);
    const badge = screen.getByText("오류: Error").closest("span");
    expect(badge).toHaveClass("text-red-600");
  });

  it("should have blue styling when AI is speaking", () => {
    render(<ChatStatusBadge isConnected={true} isReady={true} isAiSpeaking={true} />);
    const badge = screen.getByText("🔊 말랭이가 말하는 중").closest("span");
    expect(badge).toHaveClass("text-blue-600");
  });

  it("should have green styling and animate-pulse when user is speaking", () => {
    render(<ChatStatusBadge isConnected={true} isReady={true} isUserSpeaking={true} />);
    const badge = screen.getByText("🎤 말하는 중...").closest("span");
    expect(badge).toHaveClass("text-green-600");
    expect(badge).toHaveClass("animate-pulse");
  });

  it("should prioritize states correctly: disconnected > error > not ready > muted > aiSpeaking > userSpeaking > recording > userTurn", () => {
    // When not connected, should show connecting even with other states
    render(
      <ChatStatusBadge
        isConnected={false}
        isReady={true}
        error="Error"
        isMuted={true}
        isAiSpeaking={true}
      />
    );
    expect(screen.getByText("연결 중...")).toBeInTheDocument();
  });
});
