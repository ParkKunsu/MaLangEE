import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles text input", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "test value" } });
    expect(input).toHaveValue("test value");
  });

  it("applies type attribute", () => {
    render(<Input type="email" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
  });

  it("handles password type", () => {
    render(<Input type="password" data-testid="password-input" />);
    const input = screen.getByTestId("password-input");
    expect(input).toHaveAttribute("type", "password");
  });

  it("handles disabled state", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("merges custom className", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
    expect(input).toHaveClass("flex");
    expect(input).toHaveClass("h-10");
  });

  it("handles onChange event", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
  });

  it("applies name attribute", () => {
    render(<Input name="username" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "username");
  });

  it("applies aria attributes", () => {
    render(<Input aria-label="Username" aria-required="true" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-label", "Username");
    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("handles readonly state", () => {
    render(<Input readOnly value="readonly value" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("readonly value");
  });
});
