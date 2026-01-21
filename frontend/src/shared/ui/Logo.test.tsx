import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Logo", () => {
  it("should render MalangEE text", () => {
    render(<Logo />);
    expect(screen.getByText("MalangEE")).toBeInTheDocument();
  });

  it("should render as link with default href", () => {
    render(<Logo />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });

  it("should render as link with custom href", () => {
    render(<Logo href="/dashboard" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("should render without link when href is empty string", () => {
    render(<Logo href="" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("MalangEE")).toBeInTheDocument();
  });

  it("should apply sm size classes", () => {
    render(<Logo size="sm" href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("text-lg");
  });

  it("should apply md size classes (default)", () => {
    render(<Logo href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("text-xl");
  });

  it("should apply lg size classes", () => {
    render(<Logo size="lg" href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("text-2xl");
  });

  it("should apply brand color (default)", () => {
    render(<Logo href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("text-brand");
  });

  it("should apply white color", () => {
    render(<Logo color="white" href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("text-white");
  });

  it("should apply dark color", () => {
    render(<Logo color="dark" href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("text-text-primary");
  });

  it("should apply custom className", () => {
    render(<Logo className="custom-class" href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("custom-class");
  });

  it("should have font-semibold styling", () => {
    render(<Logo href="" />);
    const logo = screen.getByText("MalangEE");
    expect(logo).toHaveClass("font-semibold");
  });
});
