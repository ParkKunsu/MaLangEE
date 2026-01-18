import React from "react";

interface ChatStatusBadgeProps {
  isConnected: boolean;
  isReady?: boolean;
  error?: string | null;
  isMuted?: boolean;
  isRecording?: boolean;
  isAiSpeaking?: boolean;
  isUserTurn?: boolean;
  isUserSpeaking?: boolean;
  className?: string;
}

export const ChatStatusBadge: React.FC<ChatStatusBadgeProps> = ({
  isConnected,
  isReady,
  error,
  isMuted,
  isRecording,
  isAiSpeaking,
  isUserTurn,
  isUserSpeaking,
  className = "",
}) => {
  let text = "";
  let colorClass = "text-gray-600 border-gray-200 bg-gray-50/50";

  if (!isConnected) {
    text = "연결 중...";
    colorClass = "text-yellow-600 border-yellow-100 bg-yellow-50/50";
  } else if (error) {
    text = `오류: ${error}`;
    colorClass = "text-red-600 border-red-100 bg-red-50/50";
  } else if (!isReady) {
    text = "준비 중...";
    colorClass = "text-yellow-600 border-yellow-100 bg-yellow-50/50";
  } else if (isMuted) {
    text = "🔇 음소거중";
    colorClass = "text-orange-600 border-orange-100 bg-orange-50/50";
  } else if (isAiSpeaking) {
    text = "🔊 말랭이가 말하는 중";
    colorClass = "text-blue-600 border-blue-100 bg-blue-50/50";
  } else if (isUserSpeaking) {
    text = "🎤 말하는 중...";
    colorClass = "text-green-600 border-green-100 bg-green-50/50 animate-pulse";
  } else if (isRecording) {
    text = "🎤 말랭이가 듣는 중";
    colorClass = "text-green-600 border-green-100 bg-green-50/50";
  } else if (isUserTurn) {
    text = "말랭이가 듣는 중";
    colorClass = "text-green-600 border-green-100 bg-green-50/50";
  } else {
    text = "대기 중";
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${colorClass}`}>
        {text}
      </span>
    </div>
  );
};
