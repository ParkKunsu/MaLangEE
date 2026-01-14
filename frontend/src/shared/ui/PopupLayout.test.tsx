import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PopupLayout } from "./PopupLayout";

describe("PopupLayout", () => {
  it("renders children content", () => {
    render(
      <PopupLayout onClose={() => {}}>
        <div>Popup Content</div>
      </PopupLayout>
    );
    expect(screen.getByText("Popup Content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <PopupLayout onClose={() => {}} title="Test Title">
        <div>Content</div>
      </PopupLayout>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders close button by default", () => {
    render(
      <PopupLayout onClose={() => {}}>
        <div>Content</div>
      </PopupLayout>
    );
    expect(screen.getByLabelText("닫기")).toBeInTheDocument();
  });

  it("hides close button when showCloseButton is false", () => {
    render(
      <PopupLayout onClose={() => {}} showCloseButton={false}>
        <div>Content</div>
      </PopupLayout>
    );
    expect(screen.queryByLabelText("닫기")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <PopupLayout onClose={handleClose}>
        <div>Content</div>
      </PopupLayout>
    );

    fireEvent.click(screen.getByLabelText("닫기"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    render(
      <PopupLayout onClose={handleClose}>
        <div>Content</div>
      </PopupLayout>
    );

    const backdrop = document.querySelector(".fixed.inset-0");
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when content is clicked", () => {
    const handleClose = vi.fn();
    render(
      <PopupLayout onClose={handleClose}>
        <div>Content</div>
      </PopupLayout>
    );

    fireEvent.click(screen.getByText("Content"));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("renders headerContent when provided", () => {
    render(
      <PopupLayout
        onClose={() => {}}
        headerContent={<div>Custom Header</div>}
      >
        <div>Content</div>
      </PopupLayout>
    );
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
  });

  it("prefers headerContent over title", () => {
    render(
      <PopupLayout
        onClose={() => {}}
        title="Title"
        headerContent={<div>Custom Header</div>}
      >
        <div>Content</div>
      </PopupLayout>
    );
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
  });

  it("applies default maxWidth of 2xl", () => {
    render(
      <PopupLayout onClose={() => {}}>
        <div>Content</div>
      </PopupLayout>
    );
    const popup = document.querySelector(".max-w-2xl");
    expect(popup).toBeInTheDocument();
  });

  it("applies custom maxWidth", () => {
    const { rerender } = render(
      <PopupLayout onClose={() => {}} maxWidth="sm">
        <div>Content</div>
      </PopupLayout>
    );
    expect(document.querySelector(".max-w-sm")).toBeInTheDocument();

    rerender(
      <PopupLayout onClose={() => {}} maxWidth="lg">
        <div>Content</div>
      </PopupLayout>
    );
    expect(document.querySelector(".max-w-lg")).toBeInTheDocument();

    rerender(
      <PopupLayout onClose={() => {}} maxWidth="4xl">
        <div>Content</div>
      </PopupLayout>
    );
    expect(document.querySelector(".max-w-4xl")).toBeInTheDocument();
  });
});
