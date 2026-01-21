import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageBackground } from "./PageBackground";

// Mock DecorativeCircle
vi.mock("./DecorativeCircle", () => ({
  DecorativeCircle: ({ className }: { className?: string }) => (
    <div data-testid="decorative-circle" className={className} aria-hidden="true" />
  ),
}));

describe("PageBackground", () => {
  it("should render children", () => {
    render(
      <PageBackground>
        <div data-testid="child">Child Content</div>
      </PageBackground>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should apply gradient variant by default", () => {
    const { container } = render(
      <PageBackground>Content</PageBackground>
    );

    expect(container.firstChild).toHaveClass("bg-gradient-to-br");
  });

  it("should apply solid variant", () => {
    const { container } = render(
      <PageBackground variant="solid">Content</PageBackground>
    );

    expect(container.firstChild).toHaveClass("bg-background");
  });

  it("should show decorations by default", () => {
    render(<PageBackground>Content</PageBackground>);

    const decorations = screen.getAllByTestId("decorative-circle");
    expect(decorations.length).toBe(6);
  });

  it("should hide decorations when showDecorations is false", () => {
    render(
      <PageBackground showDecorations={false}>Content</PageBackground>
    );

    expect(screen.queryAllByTestId("decorative-circle").length).toBe(0);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <PageBackground className="custom-class">Content</PageBackground>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should have min-h-screen", () => {
    const { container } = render(
      <PageBackground>Content</PageBackground>
    );

    expect(container.firstChild).toHaveClass("min-h-screen");
  });

  it("should have overflow-hidden", () => {
    const { container } = render(
      <PageBackground>Content</PageBackground>
    );

    expect(container.firstChild).toHaveClass("overflow-hidden");
  });

  it("should render content with relative z-10", () => {
    const { container } = render(
      <PageBackground>Content</PageBackground>
    );

    const contentWrapper = container.querySelector(".relative.z-10");
    expect(contentWrapper).toBeInTheDocument();
  });

  it("should have decorations container with pointer-events-none", () => {
    const { container } = render(
      <PageBackground>Content</PageBackground>
    );

    const decorationsContainer = container.querySelector(".pointer-events-none");
    expect(decorationsContainer).toBeInTheDocument();
  });
});
