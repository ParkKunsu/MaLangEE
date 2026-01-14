import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders correctly", () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles text input", () => {
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "test value" } });
    expect(textarea).toHaveValue("test value");
  });

  it("handles disabled state", () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
  });

  it("merges custom className", () => {
    render(<Textarea className="custom-class" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("custom-class");
    expect(textarea).toHaveClass("flex");
    expect(textarea).toHaveClass("min-h-[80px]");
  });

  it("handles onChange event", () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "new value" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("applies name attribute", () => {
    render(<Textarea name="description" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("name", "description");
  });

  it("handles rows attribute", () => {
    render(<Textarea rows={10} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "10");
  });

  it("handles maxLength attribute", () => {
    render(<Textarea maxLength={100} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("maxLength", "100");
  });

  it("handles readonly state", () => {
    render(<Textarea readOnly value="readonly value" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toHaveValue("readonly value");
  });
});
