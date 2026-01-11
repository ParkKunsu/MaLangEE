import { FC } from "react";
import { Mic, MicOff } from "lucide-react";
import "./MicButton.css";

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  isMuted?: boolean;
}

export const MicButton: FC<MicButtonProps> = ({
  isListening,
  onClick,
  size = "md",
  className = "",
  isMuted = false,
}) => {
  const sizeClasses = {
    sm: "mic-container-sm",
    md: "mic-container-md",
    lg: "mic-container-lg",
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36,
  };

  return (
    <div
      className={`mic-container ${sizeClasses[size]} ${isListening ? "is-listening" : ""} ${isMuted ? "is-muted" : ""} ${className}`}
      onClick={onClick}
    >
      {/* Waves */}
      <div className="waves">
        <div className="wave wave-1" />
        <div className="wave wave-2" />
        <div className="wave wave-3" />
      </div>

      {/* Main Mic Button */}
      <div className="mic-main">
        {isMuted ? (
          <MicOff size={iconSizes[size]} strokeWidth={2} />
        ) : (
          <Mic size={iconSizes[size]} strokeWidth={2} />
        )}
      </div>
    </div>
  );
};
