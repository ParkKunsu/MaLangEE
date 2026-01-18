import React from "react";
import { MicButton } from "./MicButton";
import { ScenarioState, ConversationState } from "@/features/chat/hook";

interface ChatMicButtonProps {
  state: ScenarioState | ConversationState;
  isPaused?: boolean;
  isMuted?: boolean;
  hasStarted?: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ChatMicButton: React.FC<ChatMicButtonProps> = ({
  state,
  isPaused = false,
  isMuted = false, // 음소거 여부
  hasStarted = true, // 대화 시작 여부
  onClick,
  size = "md",
  className = "",
}) => {
  // 1. 음소거/일시중지 여부
  const muted = isMuted || isPaused;

  // 2. 웨이브 표시 여부 (사용자 차례이고, 대화가 시작되었으며, 음소거가 아닐 때)
  const isUserTurn = !state.isAiSpeaking && state.isConnected;
  const showWaves = (hasStarted || isUserTurn) && !muted;

  // 3. 비활성화 여부 (연결 끊김, AI 발화 중, 일시중지 중)
  // 단, 대화 시작 전(!hasStarted)에는 클릭이 가능해야 함
  const isDisabled = !state.isConnected || (hasStarted && state.isAiSpeaking) || isPaused;

  return (
    <MicButton
      isListening={showWaves}
      onClick={onClick}
      size={size}
      isMuted={muted}
      className={`${isDisabled ? "pointer-events-none opacity-50" : ""} ${className}`}
    />
  );
};
