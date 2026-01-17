"use client";

import React from "react";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { MalangEE } from "@/shared/ui";

interface Message {
  speaker: string;
  content: string;
  timestamp?: string;
}

interface ChatTranscriptPopupProps {
  sessionTitle: string;
  messages: Message[];
  onClose: () => void;
}

export const ChatTranscriptPopup: React.FC<ChatTranscriptPopupProps> = ({
  sessionTitle,
  messages,
  onClose,
}) => {
  const headerContent = (
    <div className="flex-1 space-y-1">
      <h2 className="text-xl font-bold text-[#1F1C2B]">전문 스크립트</h2>
      <p className="text-sm text-[#6A667A]">{sessionTitle}</p>
    </div>
  );

  return (
    <PopupLayout onClose={onClose} headerContent={headerContent} maxWidth="2xl">
      <div className="bg-[#BACEE0] -mx-6 -mb-6 p-4 min-h-[400px] max-h-[60vh] overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => {
            const isMalang = message.speaker === "말랭이";
            
            return (
              <div
                key={index}
                className={`flex w-full ${isMalang ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex max-w-[85%] ${isMalang ? "flex-row" : "flex-row-reverse"} items-end gap-2`}>
                  {/* 프로필 이미지 (말랭이만 표시) */}
                  {isMalang && (
                    <div className="flex-shrink-0 self-start mt-1">
                      <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
                        <MalangEE size={32} />
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-col ${isMalang ? "items-start" : "items-end"}`}>
                    {/* 이름 (말랭이만 표시) */}
                    {isMalang && (
                      <span className="text-xs text-[#424242] mb-1 ml-1 font-medium">
                        {message.speaker}
                      </span>
                    )}
                    
                    <div className="flex items-end gap-1.5">
                      {/* 말풍선 */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                          isMalang
                            ? "bg-white text-[#1F1C2B] rounded-tl-none"
                            : "bg-[#FEE500] text-[#1F1C2B] rounded-tr-none"
                        }`}
                      >
                        {message.content}
                      </div>

                      {/* 시간 */}
                      {message.timestamp && (
                        <span className="text-[10px] text-[#6A667A] mb-0.5 shrink-0">
                          {message.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PopupLayout>
  );
};
