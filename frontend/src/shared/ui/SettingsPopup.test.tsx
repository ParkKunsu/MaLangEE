import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPopup, SettingsTrigger, VOICE_OPTIONS } from "./SettingsPopup";

describe("SettingsPopup", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    showSubtitle: true,
    onSubtitleChange: vi.fn(),
    selectedVoice: "shimmer",
    onVoiceChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when open", () => {
    it("should render the popup with title", () => {
      render(<SettingsPopup {...defaultProps} />);
      expect(screen.getByText("설정 변경하기")).toBeInTheDocument();
    });

    it("should render subtitle toggle", () => {
      render(<SettingsPopup {...defaultProps} />);
      expect(screen.getByText("말랭이 대답 자막")).toBeInTheDocument();
    });

    it("should render voice selector", () => {
      render(<SettingsPopup {...defaultProps} />);
      expect(screen.getByText("목소리 변경하기")).toBeInTheDocument();
      expect(screen.getByText("Shimmer")).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(<SettingsPopup {...defaultProps} />);
      expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();
    });
  });

  describe("when closed", () => {
    it("should not render anything", () => {
      render(<SettingsPopup {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("설정 변경하기")).not.toBeInTheDocument();
    });
  });

  describe("subtitle toggle", () => {
    it("should show toggle in on state when showSubtitle is true", () => {
      render(<SettingsPopup {...defaultProps} showSubtitle={true} />);
      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    it("should show toggle in off state when showSubtitle is false", () => {
      render(<SettingsPopup {...defaultProps} showSubtitle={false} />);
      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    it("should call onSubtitleChange when toggle is clicked", () => {
      render(<SettingsPopup {...defaultProps} showSubtitle={true} />);
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);
      expect(defaultProps.onSubtitleChange).toHaveBeenCalledWith(false);
    });

    it("should call onSubtitleChange with true when toggling from off", () => {
      render(<SettingsPopup {...defaultProps} showSubtitle={false} />);
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);
      expect(defaultProps.onSubtitleChange).toHaveBeenCalledWith(true);
    });
  });

  describe("voice selector", () => {
    it("should display the selected voice name", () => {
      render(<SettingsPopup {...defaultProps} selectedVoice="echo" />);
      expect(screen.getByText("Echo")).toBeInTheDocument();
    });

    it("should call onVoiceChange with next voice when clicking right arrow", () => {
      render(<SettingsPopup {...defaultProps} selectedVoice="shimmer" />);
      const nextButton = screen.getByLabelText("다음 목소리");
      fireEvent.click(nextButton);
      // shimmer (index 1) -> alloy (index 2)
      expect(defaultProps.onVoiceChange).toHaveBeenCalledWith("alloy");
    });

    it("should call onVoiceChange with previous voice when clicking left arrow", () => {
      render(<SettingsPopup {...defaultProps} selectedVoice="shimmer" />);
      const prevButton = screen.getByLabelText("이전 목소리");
      fireEvent.click(prevButton);
      // shimmer (index 1) -> echo (index 0)
      expect(defaultProps.onVoiceChange).toHaveBeenCalledWith("echo");
    });

    it("should wrap around to first voice when at last voice and clicking next", () => {
      render(<SettingsPopup {...defaultProps} selectedVoice="nova" />);
      const nextButton = screen.getByLabelText("다음 목소리");
      fireEvent.click(nextButton);
      // nova (index 3, last) -> echo (index 0)
      expect(defaultProps.onVoiceChange).toHaveBeenCalledWith("echo");
    });

    it("should wrap around to last voice when at first voice and clicking prev", () => {
      render(<SettingsPopup {...defaultProps} selectedVoice="echo" />);
      const prevButton = screen.getByLabelText("이전 목소리");
      fireEvent.click(prevButton);
      // echo (index 0) -> nova (index 3, last)
      expect(defaultProps.onVoiceChange).toHaveBeenCalledWith("nova");
    });
  });

  describe("close behavior", () => {
    it("should call onClose when close button is clicked", () => {
      render(<SettingsPopup {...defaultProps} />);
      const closeButton = screen.getByRole("button", { name: "닫기" });
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("should call onClose when backdrop is clicked", () => {
      render(<SettingsPopup {...defaultProps} />);
      // Click on backdrop (the outer div)
      const backdrop = document.querySelector(".fixed.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });

    it("should not call onClose when popup content is clicked", () => {
      render(<SettingsPopup {...defaultProps} />);
      const title = screen.getByText("설정 변경하기");
      fireEvent.click(title);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
});

describe("SettingsTrigger", () => {
  it("should render trigger button with text", () => {
    render(<SettingsTrigger onClick={vi.fn()} />);
    expect(screen.getByText("설정 변경하기")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const onClick = vi.fn();
    render(<SettingsTrigger onClick={onClick} />);
    const button = screen.getByText("설정 변경하기");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    render(<SettingsTrigger onClick={vi.fn()} className="custom-class" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});

describe("VOICE_OPTIONS", () => {
  it("should have 4 voice options", () => {
    expect(VOICE_OPTIONS).toHaveLength(4);
  });

  it("should have valid voice option structure", () => {
    VOICE_OPTIONS.forEach((option) => {
      expect(option).toHaveProperty("id");
      expect(option).toHaveProperty("name");
      expect(option).toHaveProperty("description");
      expect(typeof option.id).toBe("string");
      expect(typeof option.name).toBe("string");
      expect(typeof option.description).toBe("string");
    });
  });

  it("should include shimmer voice", () => {
    const shimmer = VOICE_OPTIONS.find((v) => v.id === "shimmer");
    expect(shimmer).toBeDefined();
    expect(shimmer?.name).toBe("Shimmer");
  });
});
