import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant classes correctly", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-[#7666f5]");

    rerender(<Button variant="outline-purple">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-[#7B6CF6]");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-[#D4CCFF]");
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-[40px]");

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-[48px]");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-[56px]");

    rerender(<Button size="xl">XLarge</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-[64px]");
  });

  it("applies fullWidth class when true", () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("does not apply fullWidth class when false", () => {
    render(<Button fullWidth={false}>Normal Width</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-auto");
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("disables button when disabled prop is true", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("disables button when isLoading is true", () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("merges custom className with variant classes", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("custom-class");
    expect(button).toHaveClass("inline-flex");
  });

  it("renders as child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Link Button" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("applies default variants when no props provided", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("w-auto");
  });

  it("forwards ref to button element", () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
  });

  it("passes through additional button attributes", () => {
    render(
      <Button type="submit" name="submitBtn" aria-label="Submit form">
        Submit
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("name", "submitBtn");
    expect(button).toHaveAttribute("aria-label", "Submit form");
  });
});
