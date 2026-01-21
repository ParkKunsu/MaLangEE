import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SplitViewLayout } from "./SplitViewLayout";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock GlassCard
vi.mock("./GlassCard", () => ({
  GlassCard: ({ children, showHeader }: { children: React.ReactNode; showHeader?: boolean }) => (
    <div data-testid="glass-card" data-show-header={showHeader}>
      {children}
    </div>
  ),
}));

// Mock MalangEE
vi.mock("./MalangEE", () => ({
  MalangEE: ({ size }: { size: number }) => (
    <div data-testid="malangee" data-size={size}>MalangEE</div>
  ),
}));

describe("SplitViewLayout", () => {
  beforeEach(() => {
    document.body.className = "";
  });

  afterEach(() => {
    document.body.className = "";
  });

  it("should render rightChildren", () => {
    render(
      <SplitViewLayout rightChildren={<div data-testid="right">Right Content</div>} />
    );

    expect(screen.getByTestId("right")).toBeInTheDocument();
    expect(screen.getByText("Right Content")).toBeInTheDocument();
  });

  it("should render leftChildren when provided", () => {
    render(
      <SplitViewLayout
        leftChildren={<div data-testid="left">Left Content</div>}
        rightChildren={<div>Right</div>}
      />
    );

    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByText("Left Content")).toBeInTheDocument();
  });

  it("should render logo by default", () => {
    render(<SplitViewLayout rightChildren={<div>Right</div>} />);

    expect(screen.getByAltText("MalangEE Logo")).toBeInTheDocument();
  });

  it("should render MalangEE character", () => {
    render(<SplitViewLayout rightChildren={<div>Right</div>} />);

    expect(screen.getByTestId("malangee")).toBeInTheDocument();
  });

  it("should apply default bgClass to body", () => {
    render(<SplitViewLayout rightChildren={<div>Right</div>} />);

    expect(document.body.classList.contains("bg-login-01")).toBe(true);
  });

  it("should apply custom bgClass to body", () => {
    render(
      <SplitViewLayout bgClass="bg-custom" rightChildren={<div>Right</div>} />
    );

    expect(document.body.classList.contains("bg-custom")).toBe(true);
  });

  it("should remove bgClass on unmount", () => {
    const { unmount } = render(
      <SplitViewLayout bgClass="bg-test" rightChildren={<div>Right</div>} />
    );

    expect(document.body.classList.contains("bg-test")).toBe(true);

    unmount();

    expect(document.body.classList.contains("bg-test")).toBe(false);
  });

  it("should show header by default", () => {
    render(<SplitViewLayout rightChildren={<div>Right</div>} />);

    const glassCard = screen.getByTestId("glass-card");
    expect(glassCard).toHaveAttribute("data-show-header", "true");
  });

  it("should hide header when showHeader is false", () => {
    render(
      <SplitViewLayout showHeader={false} rightChildren={<div>Right</div>} />
    );

    const glassCard = screen.getByTestId("glass-card");
    expect(glassCard).toHaveAttribute("data-show-header", "false");
  });

  it("should apply custom maxWidth", () => {
    const { container } = render(
      <SplitViewLayout maxWidth="md:max-w-4xl" rightChildren={<div>Right</div>} />
    );

    expect(container.querySelector(".md\\:max-w-4xl")).toBeInTheDocument();
  });

  it("should apply custom leftClassName", () => {
    const { container } = render(
      <SplitViewLayout
        leftClassName="custom-left-class"
        rightChildren={<div>Right</div>}
      />
    );

    expect(container.querySelector("#sv-left-content")).toHaveClass("custom-left-class");
  });

  it("should apply custom rightClassName", () => {
    const { container } = render(
      <SplitViewLayout
        rightClassName="custom-right-class"
        rightChildren={<div>Right</div>}
      />
    );

    const rightContainer = container.querySelector(".custom-right-class");
    expect(rightContainer).toBeInTheDocument();
  });

  it("should have main-page and glass-page classes", () => {
    const { container } = render(
      <SplitViewLayout rightChildren={<div>Right</div>} />
    );

    expect(container.firstChild).toHaveClass("main-page");
    expect(container.firstChild).toHaveClass("glass-page");
  });

  it("should use default colSpan values", () => {
    const { container } = render(
      <SplitViewLayout rightChildren={<div>Right</div>} />
    );

    const leftSection = container.querySelector("#sv-left-content");
    expect(leftSection).toHaveClass("md:col-span-5");
  });
});
