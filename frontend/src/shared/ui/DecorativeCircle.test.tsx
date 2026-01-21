import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DecorativeCircle } from "./DecorativeCircle";

describe("DecorativeCircle", () => {
  it("should render with default props", () => {
    const { container } = render(<DecorativeCircle />);
    const circle = container.firstChild as HTMLElement;

    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute("aria-hidden", "true");
  });

  it("should apply sm size class", () => {
    const { container } = render(<DecorativeCircle size="sm" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("h-16", "w-16");
  });

  it("should apply md size class (default)", () => {
    const { container } = render(<DecorativeCircle />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("h-24", "w-24");
  });

  it("should apply lg size class", () => {
    const { container } = render(<DecorativeCircle size="lg" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("h-32", "w-32");
  });

  it("should apply xl size class", () => {
    const { container } = render(<DecorativeCircle size="xl" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("h-40", "w-40");
  });

  it("should apply purple color class (default)", () => {
    const { container } = render(<DecorativeCircle />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("bg-brand-200");
  });

  it("should apply blue color class", () => {
    const { container } = render(<DecorativeCircle color="blue" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("bg-gradient-blue");
  });

  it("should apply yellow color class", () => {
    const { container } = render(<DecorativeCircle color="yellow" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("bg-yellow-200");
  });

  it("should apply white color class", () => {
    const { container } = render(<DecorativeCircle color="white" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("bg-white/30");
  });

  it("should apply sm blur class", () => {
    const { container } = render(<DecorativeCircle blur="sm" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("blur-xl");
  });

  it("should apply md blur class", () => {
    const { container } = render(<DecorativeCircle blur="md" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("blur-2xl");
  });

  it("should apply lg blur class (default)", () => {
    const { container } = render(<DecorativeCircle />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("blur-3xl");
  });

  it("should apply xl blur class", () => {
    const { container } = render(<DecorativeCircle blur="xl" />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("blur-[4rem]");
  });

  it("should apply default opacity", () => {
    const { container } = render(<DecorativeCircle />);
    const circle = container.firstChild as HTMLElement;

    expect(circle.style.opacity).toBe("0.5");
  });

  it("should apply custom opacity", () => {
    const { container } = render(<DecorativeCircle opacity={0.8} />);
    const circle = container.firstChild as HTMLElement;

    expect(circle.style.opacity).toBe("0.8");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <DecorativeCircle className="absolute top-10 left-10" />
    );
    const circle = container.firstChild;

    expect(circle).toHaveClass("absolute", "top-10", "left-10");
  });

  it("should have pointer-events-none", () => {
    const { container } = render(<DecorativeCircle />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("pointer-events-none");
  });

  it("should be rounded-full", () => {
    const { container } = render(<DecorativeCircle />);
    const circle = container.firstChild;

    expect(circle).toHaveClass("rounded-full");
  });
});
