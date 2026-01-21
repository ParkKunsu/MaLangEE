import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("should render with label", () => {
    render(<Toggle label="Test Label" enabled={false} onChange={() => {}} />);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("should render without label", () => {
    render(<Toggle enabled={false} onChange={() => {}} />);

    expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
  });

  it("should show OFF when disabled", () => {
    render(<Toggle enabled={false} onChange={() => {}} />);

    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.queryByText("ON")).not.toBeInTheDocument();
  });

  it("should show ON when enabled", () => {
    render(<Toggle enabled={true} onChange={() => {}} />);

    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.queryByText("OFF")).not.toBeInTheDocument();
  });

  it("should call onChange with true when clicked while disabled", () => {
    const handleChange = vi.fn();
    render(<Toggle enabled={false} onChange={handleChange} />);

    fireEvent.click(screen.getByRole("switch"));

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("should call onChange with false when clicked while enabled", () => {
    const handleChange = vi.fn();
    render(<Toggle enabled={true} onChange={handleChange} />);

    fireEvent.click(screen.getByRole("switch"));

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("should have correct aria-checked attribute when enabled", () => {
    render(<Toggle enabled={true} onChange={() => {}} />);

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("should have correct aria-checked attribute when disabled", () => {
    render(<Toggle enabled={false} onChange={() => {}} />);

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Toggle enabled={false} onChange={() => {}} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
