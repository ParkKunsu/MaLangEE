import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FullLayout } from "./FullLayout";

// Mock GlassCard
vi.mock("./GlassCard", () => ({
  GlassCard: ({ children, showHeader, headerRight }: { children: React.ReactNode; showHeader?: boolean; headerRight?: React.ReactNode }) => (
    <div data-testid="glass-card" data-show-header={showHeader}>
      {headerRight && <div data-testid="header-right">{headerRight}</div>}
      {children}
    </div>
  ),
}));

describe("FullLayout", () => {
  beforeEach(() => {
    // Clean up body classes
    document.body.className = "";
  });

  afterEach(() => {
    document.body.className = "";
  });

  it("should render children", () => {
    render(
      <FullLayout>
        <div data-testid="child">Child Content</div>
      </FullLayout>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should apply default bgClass to body", () => {
    render(<FullLayout>Content</FullLayout>);

    expect(document.body.classList.contains("bg-login-02")).toBe(true);
  });

  it("should apply custom bgClass to body", () => {
    render(<FullLayout bgClass="bg-custom">Content</FullLayout>);

    expect(document.body.classList.contains("bg-custom")).toBe(true);
  });

  it("should remove bgClass on unmount", () => {
    const { unmount } = render(<FullLayout bgClass="bg-test">Content</FullLayout>);

    expect(document.body.classList.contains("bg-test")).toBe(true);

    unmount();

    expect(document.body.classList.contains("bg-test")).toBe(false);
  });

  it("should not show header by default", () => {
    render(<FullLayout>Content</FullLayout>);

    const glassCard = screen.getByTestId("glass-card");
    expect(glassCard).toHaveAttribute("data-show-header", "false");
  });

  it("should show header when showHeader is true", () => {
    render(<FullLayout showHeader>Content</FullLayout>);

    const glassCard = screen.getByTestId("glass-card");
    expect(glassCard).toHaveAttribute("data-show-header", "true");
  });

  it("should render headerRight content", () => {
    render(
      <FullLayout headerRight={<span>Header Right</span>}>
        Content
      </FullLayout>
    );

    expect(screen.getByTestId("header-right")).toBeInTheDocument();
    expect(screen.getByText("Header Right")).toBeInTheDocument();
  });

  it("should show background blobs when withBackground is true", () => {
    const { container } = render(
      <FullLayout withBackground>Content</FullLayout>
    );

    expect(container.querySelector(".blob-1")).toBeInTheDocument();
    expect(container.querySelector(".blob-2")).toBeInTheDocument();
    expect(container.querySelector(".blob-3")).toBeInTheDocument();
  });

  it("should not show background blobs by default", () => {
    const { container } = render(<FullLayout>Content</FullLayout>);

    expect(container.querySelector(".blob-1")).not.toBeInTheDocument();
  });

  it("should apply custom maxWidth", () => {
    const { container } = render(
      <FullLayout maxWidth="max-w-sm">Content</FullLayout>
    );

    const widthContainer = container.querySelector(".max-w-sm");
    expect(widthContainer).toBeInTheDocument();
  });

  it("should have main-page and glass-page classes", () => {
    const { container } = render(<FullLayout>Content</FullLayout>);

    expect(container.firstChild).toHaveClass("main-page");
    expect(container.firstChild).toHaveClass("glass-page");
  });

  it("should have min-h-screen", () => {
    const { container } = render(<FullLayout>Content</FullLayout>);

    expect(container.firstChild).toHaveClass("min-h-screen");
  });
});
