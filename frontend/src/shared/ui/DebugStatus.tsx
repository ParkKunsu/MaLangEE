import React from "react";

interface DebugStatusProps {
  isConnected: boolean;
  lastEvent: string | null;
  isAiSpeaking: boolean;
  isUserSpeaking?: boolean;
}

export const DebugStatus: React.FC<DebugStatusProps> = ({
  isConnected,
  lastEvent,
  isAiSpeaking,
  isUserSpeaking,
}) => {
  // 개발 환경에서만 표시 (선택 사항)
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <div className="flex items-center gap-3 rounded-full bg-black/70 px-3 py-1 text-[10px] text-white backdrop-blur-md">
        <div className="flex items-center gap-1">
          <div
            className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span>{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
        </div>
        {lastEvent && (
          <div className="border-l border-white/20 pl-3">
            LAST EVENT:{" "}
            <span className="font-mono text-yellow-400">{lastEvent.toUpperCase()}</span>
          </div>
        )}
        {isAiSpeaking && (
          <div className="animate-pulse border-l border-white/20 pl-3 text-blue-400">
            AI SPEAKING...
          </div>
        )}
        {isUserSpeaking && (
          <div className="animate-pulse border-l border-white/20 pl-3 text-green-400">
            USER SPEAKING...
          </div>
        )}
      </div>
    </div>
  );
};
