"use client";

import React from "react";
import { PopupLayout } from "@/shared/ui/PopupLayout";

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
    <div className="flex-1 space-y-2">
      <h2 className="text-2xl font-bold text-[#1F1C2B]">전문 스크립트</h2>
      <div className="flex items-center gap-4 text-sm text-[#6A667A]">
        <h3>{sessionTitle}</h3>
      </div>
    </div>
  );

  return (
    <PopupLayout onClose={onClose} headerContent={headerContent} maxWidth="2xl">

          {/* 두 번째 행 이후: 대화 목록 - 표 형태 */}
          <div className="space-y-4">

            <div className="max-h-[300px] overflow-y-auto pr-2">
            <table className="w-full border-collapse">
               
              <tbody>
                {messages.map((message, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-[#6A667A]">
                      {message.timestamp}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-sm font-medium text-[#1F1C2B]">
                      <span
                        className={
                          message.speaker === "말랭이" ? "text-[#5F51D9]" : "text-[#7B6CF6]"
                        }
                      >
                        {message.speaker}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm leading-relaxed text-[#1F1C2B]">
                      {message.content}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
    </PopupLayout>
  );
};

