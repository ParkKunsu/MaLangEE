import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassmorphicCard } from "./GlassmorphicCard";

describe("GlassmorphicCard", () => {
  it("should render children", () => {
    render(
      <GlassmorphicCard>
        <div data-testid="child">Child Content</div>
      </GlassmorphicCard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should apply default variant classes", () => {
    const { container } = render(
      <GlassmorphicCard>Content</GlassmorphicCard>
    );

    const contentDiv = container.querySelector(".relative.px-8");
    expect(contentDiv).toBeInTheDocument();
  });

  it("should apply compact variant classes", () => {
    const { container } = render(
      <GlassmorphicCard variant="compact">Content</GlassmorphicCard>
    );

    const contentDiv = container.querySelector(".relative.px-6");
    expect(contentDiv).toBeInTheDocument();
  });

  it("should show decorations when showDecorations is true", () => {
    const { container } = render(
      <GlassmorphicCard showDecorations>Content</GlassmorphicCard>
    );

    const decorations = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorations.length).toBe(2);
  });

  it("should hide decorations when showDecorations is false", () => {
    const { container } = render(
      <GlassmorphicCard showDecorations={false}>Content</GlassmorphicCard>
    );

    const decorations = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorations.length).toBe(0);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <GlassmorphicCard className="custom-class">Content</GlassmorphicCard>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should have glassmorphism styling", () => {
    const { container } = render(
      <GlassmorphicCard>Content</GlassmorphicCard>
    );

    expect(container.firstChild).toHaveClass("backdrop-blur-2xl");
    expect(container.firstChild).toHaveClass("rounded-[32px]");
  });
});
