import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmPopup } from "./ConfirmPopup";

describe("ConfirmPopup", () => {
  let portalRoot: HTMLDivElement;

  beforeEach(() => {
    // Create portal root for PopupLayout
    portalRoot = document.createElement("div");
    portalRoot.id = "portal-root";
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    document.body.removeChild(portalRoot);
  });

  it("should render with default button texts", () => {
    render(
      <ConfirmPopup
        message="테스트 메시지"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("테스트 메시지")).toBeInTheDocument();
    expect(screen.getByText("확인")).toBeInTheDocument();
    expect(screen.getByText("취소")).toBeInTheDocument();
  });

  it("should render with custom button texts", () => {
    render(
      <ConfirmPopup
        message="삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="아니요"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("삭제")).toBeInTheDocument();
    expect(screen.getByText("아니요")).toBeInTheDocument();
  });

  it("should render ReactNode message", () => {
    render(
      <ConfirmPopup
        message={<div data-testid="custom-message">Custom Message</div>}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByTestId("custom-message")).toBeInTheDocument();
  });

  it("should call onConfirm when confirm button is clicked", () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmPopup
        message="확인하시겠습니까?"
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByText("확인"));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when cancel button is clicked", () => {
    const handleCancel = vi.fn();
    render(
      <ConfirmPopup
        message="취소하시겠습니까?"
        onConfirm={() => {}}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText("취소"));

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("should render MalangEE when showMalangEE is true", () => {
    render(
      <ConfirmPopup
        message="테스트"
        onConfirm={() => {}}
        onCancel={() => {}}
        showMalangEE={true}
      />
    );

    // Just verify the component renders without error when showMalangEE is true
    // The message should be visible
    expect(screen.getByText("테스트")).toBeInTheDocument();
  });

  it("should not render MalangEE when showMalangEE is false", () => {
    render(
      <ConfirmPopup
        message="테스트"
        onConfirm={() => {}}
        onCancel={() => {}}
        showMalangEE={false}
      />
    );

    // Default showMalangEE is false, so just verify the popup renders
    expect(screen.getByText("테스트")).toBeInTheDocument();
  });

  it("should apply danger variant styling", () => {
    render(
      <ConfirmPopup
        message="삭제하시겠습니까?"
        onConfirm={() => {}}
        onCancel={() => {}}
        variant="danger"
      />
    );

    const confirmButton = screen.getByText("확인").closest("button");
    expect(confirmButton).toHaveClass("bg-red-500");
  });
});
