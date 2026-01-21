import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassCard } from "./GlassCard";

// Mock dependencies
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/features/auth/hook/use-auth", () => ({
  useAuth: () => ({
    logout: vi.fn(),
    isAuthenticated: true,
  }),
}));

describe("GlassCard", () => {
  it("should render children", () => {
    render(
      <GlassCard>
        <div data-testid="child">Child Content</div>
      </GlassCard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should not show header by default", () => {
    const { container } = render(<GlassCard>Content</GlassCard>);

    expect(container.querySelector(".glass-card-header")).not.toBeInTheDocument();
  });

  it("should show header when showHeader is true", () => {
    const { container } = render(
      <GlassCard showHeader>Content</GlassCard>
    );

    expect(container.querySelector(".glass-card-header")).toBeInTheDocument();
  });

  it("should render default logo in header", () => {
    render(<GlassCard showHeader>Content</GlassCard>);

    const logo = screen.getByAltText("MalangEE Logo");
    expect(logo).toBeInTheDocument();
  });

  it("should render custom headerLeft", () => {
    render(
      <GlassCard showHeader headerLeft={<div data-testid="custom-left">Custom Left</div>}>
        Content
      </GlassCard>
    );

    expect(screen.getByTestId("custom-left")).toBeInTheDocument();
  });

  it("should render custom headerRight", () => {
    render(
      <GlassCard showHeader headerRight={<div data-testid="custom-right">Custom Right</div>}>
        Content
      </GlassCard>
    );

    expect(screen.getByTestId("custom-right")).toBeInTheDocument();
  });

  it("should render footer when provided", () => {
    render(
      <GlassCard footer={<div data-testid="footer">Footer Content</div>}>
        Content
      </GlassCard>
    );

    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("should not render footer when not provided", () => {
    const { container } = render(<GlassCard>Content</GlassCard>);

    expect(container.querySelector(".glass-card-footer")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <GlassCard className="custom-class">Content</GlassCard>
    );

    expect(container.querySelector(".glass-card")).toHaveClass("custom-class");
  });

  it("should have glass-card and backdrop-blur-md classes", () => {
    const { container } = render(<GlassCard>Content</GlassCard>);

    expect(container.querySelector(".glass-card")).toBeInTheDocument();
    expect(container.querySelector(".backdrop-blur-md")).toBeInTheDocument();
  });

  it("should render content in glass-card-content section", () => {
    const { container } = render(
      <GlassCard>
        <span>Test Content</span>
      </GlassCard>
    );

    const contentSection = container.querySelector(".glass-card-content");
    expect(contentSection).toBeInTheDocument();
    expect(contentSection).toHaveTextContent("Test Content");
  });
});
