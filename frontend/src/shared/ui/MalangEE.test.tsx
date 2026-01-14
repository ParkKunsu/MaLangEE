import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MalangEE } from "./MalangEE";

describe("MalangEE", () => {
  it("renders with default status", () => {
    render(<MalangEE />);
    const img = screen.getByAltText("MalangEE default");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("malangee.gif"));
  });

  it("renders with talking status", () => {
    render(<MalangEE status="talking" />);
    const img = screen.getByAltText("MalangEE talking");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("malangee-talking.gif"));
  });

  it("renders with humm status", () => {
    render(<MalangEE status="humm" />);
    const img = screen.getByAltText("MalangEE humm");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("malangee-humm.gif"));
  });

  it("applies custom size", () => {
    render(<MalangEE size={150} />);
    const img = screen.getByAltText("MalangEE default");
    expect(img).toHaveAttribute("width", "150");
    expect(img).toHaveAttribute("height", "150");
  });

  it("applies default size of 300", () => {
    render(<MalangEE />);
    const img = screen.getByAltText("MalangEE default");
    expect(img).toHaveAttribute("width", "300");
    expect(img).toHaveAttribute("height", "300");
  });

  it("applies custom className", () => {
    const { container } = render(<MalangEE className="custom-class" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("items-center");
    expect(wrapper).toHaveClass("justify-center");
  });
});
