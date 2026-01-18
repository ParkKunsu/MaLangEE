import React from "react";
import { MicButton } from "./MicButton";

interface ChatMicButtonState {
  isAiSpeaking: boolean;
  isConnected: boolean;
}

interface ChatMicButtonProps {
  state: ChatMicButtonState;
  isPaused?: boolean;
  isMuted?: boolean;
  hasStarted?: boolean;
  isListening?: boolean; // 실제 마이크 켜짐 상태
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ChatMicButton: React.FC<ChatMicButtonProps> = ({
  state,
  isPaused = false,
  isMuted = false, // 음소거 여부
  hasStarted = false, // 대화 시작 여부
  isListening = false, // 실제 마이크 켜짐 상태
  onClick,
  size = "md",
  className = "",
}) => {
  // 1. 음소거/일시중지 여부
  const muted = isMuted || isPaused;

  // 2. 웨이브 표시 여부 (마이크가 실제로 켜져 있을 때만)
  const showWaves = isListening && !muted;

  // 3. 비활성화 여부
  // - 대화 시작 전(!hasStarted): 항상 클릭 가능 (연결 시작 버튼 역할)
  // - 대화 시작 후(hasStarted): 연결 끊김, AI 발화 중, 일시중지 중일 때 비활성화
  const isDisabled = hasStarted && (!state.isConnected || state.isAiSpeaking || isPaused);

  return (
    <MicButton
      isListening={showWaves}
      onClick={onClick || (() => {})}
      size={size}
      isMuted={muted}
      className={`${isDisabled ? "pointer-events-none opacity-50" : ""} ${className}`}
    />
  );
};
