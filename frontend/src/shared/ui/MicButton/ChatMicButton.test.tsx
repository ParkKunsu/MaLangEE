import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ChatMicButton } from "./ChatMicButton";

describe("ChatMicButton", () => {
  const defaultState = {
    isAiSpeaking: false,
    isConnected: true,
  };

  const getMicButton = (container: HTMLElement) => {
    return container.querySelector(".mic-container") as HTMLElement;
  };

  it("should render with default props", () => {
    const { container } = render(<ChatMicButton state={defaultState} />);
    const micButton = getMicButton(container);

    expect(micButton).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    const { container } = render(<ChatMicButton state={defaultState} onClick={handleClick} />);
    const micButton = getMicButton(container);

    fireEvent.click(micButton);

    expect(handleClick).toHaveBeenCalled();
  });

  it("should be disabled when hasStarted and not connected", () => {
    const { container } = render(
      <ChatMicButton
        state={{ isAiSpeaking: false, isConnected: false }}
        hasStarted={true}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).toContain("opacity-50");
    expect(micButton.className).toContain("pointer-events-none");
  });

  it("should be disabled when hasStarted and AI is speaking", () => {
    const { container } = render(
      <ChatMicButton
        state={{ isAiSpeaking: true, isConnected: true }}
        hasStarted={true}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).toContain("opacity-50");
    expect(micButton.className).toContain("pointer-events-none");
  });

  it("should be disabled when hasStarted and isPaused", () => {
    const { container } = render(
      <ChatMicButton
        state={defaultState}
        hasStarted={true}
        isPaused={true}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).toContain("opacity-50");
  });

  it("should not be disabled when hasStarted is false", () => {
    const { container } = render(
      <ChatMicButton
        state={{ isAiSpeaking: true, isConnected: false }}
        hasStarted={false}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).not.toContain("opacity-50");
  });

  it("should show waves when isListening and not muted", () => {
    const { container } = render(
      <ChatMicButton
        state={defaultState}
        isListening={true}
        isMuted={false}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).toContain("is-listening");
  });

  it("should not show waves when muted", () => {
    const { container } = render(
      <ChatMicButton
        state={defaultState}
        isListening={true}
        isMuted={true}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).not.toContain("is-listening");
  });

  it("should not show waves when paused", () => {
    const { container } = render(
      <ChatMicButton
        state={defaultState}
        isListening={true}
        isPaused={true}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).not.toContain("is-listening");
  });

  it("should show muted state when isMuted is true", () => {
    const { container } = render(
      <ChatMicButton
        state={defaultState}
        isMuted={true}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).toContain("is-muted");
  });

  it("should show muted state when isPaused is true", () => {
    const { container } = render(
      <ChatMicButton
        state={defaultState}
        isPaused={true}
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).toContain("is-muted");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ChatMicButton
        state={defaultState}
        className="custom-class"
      />
    );
    const micButton = getMicButton(container);

    expect(micButton.className).toContain("custom-class");
  });

  it("should handle different sizes", () => {
    const { container, rerender } = render(
      <ChatMicButton state={defaultState} size="sm" />
    );
    let micButton = getMicButton(container);
    expect(micButton.className).toContain("mic-container-sm");

    rerender(<ChatMicButton state={defaultState} size="md" />);
    micButton = getMicButton(container);
    expect(micButton.className).toContain("mic-container-md");

    rerender(<ChatMicButton state={defaultState} size="lg" />);
    micButton = getMicButton(container);
    expect(micButton.className).toContain("mic-container-lg");
  });

  it("should work without onClick handler", () => {
    const { container } = render(<ChatMicButton state={defaultState} />);
    const micButton = getMicButton(container);

    // Should not throw when clicked without handler
    expect(() => fireEvent.click(micButton)).not.toThrow();
  });
});
