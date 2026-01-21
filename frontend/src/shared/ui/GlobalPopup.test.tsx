import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlobalPopup } from "./GlobalPopup";

// Mock stores and hooks
const mockClosePopup = vi.fn();
let mockType: string | null = null;
let mockIsOpen = false;

vi.mock("@/shared/lib/store", () => ({
  usePopupStore: () => ({
    type: mockType,
    isOpen: mockIsOpen,
    closePopup: mockClosePopup,
  }),
}));

const mockLogout = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
  useDeleteUser: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock PopupLayout
vi.mock("./PopupLayout", () => ({
  PopupLayout: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="popup-layout" onClick={onClose}>
      {children}
    </div>
  ),
}));

// Mock Button
vi.mock("./Button", () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock MalangEE
vi.mock("./MalangEE", () => ({
  MalangEE: ({ status }: { status: string }) => (
    <div data-testid="malangee" data-status={status}>MalangEE</div>
  ),
}));

describe("GlobalPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockType = null;
    mockIsOpen = false;
  });

  it("should return null when popup is closed", () => {
    mockIsOpen = false;
    mockType = "logout";

    const { container } = render(<GlobalPopup />);

    expect(container.firstChild).toBeNull();
  });

  it("should return null when no type", () => {
    mockIsOpen = true;
    mockType = null;

    const { container } = render(<GlobalPopup />);

    expect(container.firstChild).toBeNull();
  });

  describe("Logout Popup", () => {
    beforeEach(() => {
      mockIsOpen = true;
      mockType = "logout";
    });

    it("should render logout popup content", () => {
      render(<GlobalPopup />);

      expect(screen.getByText("정말 로그아웃 하실건가요?")).toBeInTheDocument();
    });

    it("should show MalangEE with humm status", () => {
      render(<GlobalPopup />);

      const malangee = screen.getByTestId("malangee");
      expect(malangee).toHaveAttribute("data-status", "humm");
    });

    it("should have 닫기 and 로그아웃 buttons", () => {
      render(<GlobalPopup />);

      expect(screen.getByText("닫기")).toBeInTheDocument();
      expect(screen.getByText("로그아웃")).toBeInTheDocument();
    });

    it("should call closePopup when 닫기 is clicked", () => {
      render(<GlobalPopup />);

      fireEvent.click(screen.getByText("닫기"));

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("should call logout and closePopup when 로그아웃 is clicked", () => {
      render(<GlobalPopup />);

      fireEvent.click(screen.getByText("로그아웃"));

      expect(mockLogout).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
    });
  });

  describe("DeleteUser Popup", () => {
    beforeEach(() => {
      mockIsOpen = true;
      mockType = "deleteUser";
    });

    it("should render deleteUser popup content", () => {
      render(<GlobalPopup />);

      expect(screen.getByText("정말 탈퇴하시겠어요?")).toBeInTheDocument();
      expect(
        screen.getByText("탈퇴 시 모든 대화 기록이 삭제되며 복구할 수 없습니다.")
      ).toBeInTheDocument();
    });

    it("should show MalangEE with sad status", () => {
      render(<GlobalPopup />);

      const malangee = screen.getByTestId("malangee");
      expect(malangee).toHaveAttribute("data-status", "sad");
    });

    it("should have 취소 and 탈퇴하기 buttons", () => {
      render(<GlobalPopup />);

      expect(screen.getByText("취소")).toBeInTheDocument();
      expect(screen.getByText("탈퇴하기")).toBeInTheDocument();
    });

    it("should call closePopup when 취소 is clicked", () => {
      render(<GlobalPopup />);

      fireEvent.click(screen.getByText("취소"));

      expect(mockClosePopup).toHaveBeenCalled();
    });
  });
});
