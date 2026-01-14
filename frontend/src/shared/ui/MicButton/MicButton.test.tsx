import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MicButton } from "./MicButton";

describe("MicButton", () => {
  it("renders with default props", () => {
    render(<MicButton isListening={false} onClick={() => {}} />);

    const container = document.querySelector(".mic-container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("mic-container-md");
    expect(container).not.toHaveClass("is-listening");
    expect(container).not.toHaveClass("is-muted");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<MicButton isListening={false} onClick={handleClick} />);

    const container = document.querySelector(".mic-container");
    fireEvent.click(container!);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies is-listening class when isListening is true", () => {
    render(<MicButton isListening={true} onClick={() => {}} />);

    const container = document.querySelector(".mic-container");
    expect(container).toHaveClass("is-listening");
  });

  it("applies is-muted class when isMuted is true", () => {
    render(<MicButton isListening={false} onClick={() => {}} isMuted={true} />);

    const container = document.querySelector(".mic-container");
    expect(container).toHaveClass("is-muted");
  });

  it("renders Mic icon when not muted", () => {
    render(<MicButton isListening={false} onClick={() => {}} isMuted={false} />);

    const micIcon = document.querySelector(".mic-main svg");
    expect(micIcon).toBeInTheDocument();
  });

  it("renders MicOff icon when muted", () => {
    render(<MicButton isListening={false} onClick={() => {}} isMuted={true} />);

    const micOffIcon = document.querySelector(".mic-main svg");
    expect(micOffIcon).toBeInTheDocument();
  });

  it("applies small size class", () => {
    render(<MicButton isListening={false} onClick={() => {}} size="sm" />);

    const container = document.querySelector(".mic-container");
    expect(container).toHaveClass("mic-container-sm");
    expect(container).not.toHaveClass("mic-container-md");
    expect(container).not.toHaveClass("mic-container-lg");
  });

  it("applies medium size class (default)", () => {
    render(<MicButton isListening={false} onClick={() => {}} size="md" />);

    const container = document.querySelector(".mic-container");
    expect(container).toHaveClass("mic-container-md");
  });

  it("applies large size class", () => {
    render(<MicButton isListening={false} onClick={() => {}} size="lg" />);

    const container = document.querySelector(".mic-container");
    expect(container).toHaveClass("mic-container-lg");
  });

  it("merges custom className", () => {
    render(
      <MicButton
        isListening={false}
        onClick={() => {}}
        className="custom-class"
      />
    );

    const container = document.querySelector(".mic-container");
    expect(container).toHaveClass("custom-class");
    expect(container).toHaveClass("mic-container-md");
  });

  it("renders wave animation elements", () => {
    render(<MicButton isListening={true} onClick={() => {}} />);

    expect(document.querySelector(".waves")).toBeInTheDocument();
    expect(document.querySelector(".wave-1")).toBeInTheDocument();
    expect(document.querySelector(".wave-2")).toBeInTheDocument();
    expect(document.querySelector(".wave-3")).toBeInTheDocument();
  });

  it("combines multiple state classes correctly", () => {
    render(
      <MicButton
        isListening={true}
        onClick={() => {}}
        isMuted={true}
        size="lg"
        className="extra-class"
      />
    );

    const container = document.querySelector(".mic-container");
    expect(container).toHaveClass("mic-container-lg");
    expect(container).toHaveClass("is-listening");
    expect(container).toHaveClass("is-muted");
    expect(container).toHaveClass("extra-class");
  });
});
