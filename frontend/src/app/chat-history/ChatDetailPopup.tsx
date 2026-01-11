"use client";

import React, { useState } from "react";
import type { ChatHistoryItem } from "@/shared/types/chat";
import { ChatTranscriptPopup } from "./ChatTranscriptPopup";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { Button } from "@/shared/ui";

interface ChatDetailPopupProps {
  session: ChatHistoryItem;
  onClose: () => void;
}

export const ChatDetailPopup: React.FC<ChatDetailPopupProps> = ({ session, onClose }) => {
  const [showTranscript, setShowTranscript] = useState(false);

  // 샘플 대화 데이터 (실제로는 API에서 가져올 데이터)
  const sampleMessages = [
    { speaker: "말랭이", content: "Hello! How are you today?", timestamp: "10:30" },
    { speaker: "사용자", content: "I'm good, thanks! How about you?", timestamp: "10:31" },
    { speaker: "말랭이", content: "I'm doing great! What would you like to talk about today?", timestamp: "10:32" },
    { speaker: "사용자", content: "I'd like to discuss about the movie we watched last week.", timestamp: "10:33" },
    { speaker: "말랭이", content: "That sounds interesting! What did you think about it?", timestamp: "10:34" },
    { speaker: "사용자", content: "I think the movie was really good and interesting.", timestamp: "10:35" },
    { speaker: "말랭이", content: "I'm glad you enjoyed it! What was your favorite part?", timestamp: "10:36" },
  ];

  const headerContent = (
    <div className="flex-1 space-y-2">
      <h2 className="text-2xl font-bold text-[#1F1C2B]">{session.title}</h2>
      <div className="flex items-center gap-4 text-sm text-[#6A667A]">
        <span>{session.date}</span>
        <span>•</span>
        <span>{session.duration}</span>
      </div>
    </div>
  );

  return (
    <>
      <PopupLayout onClose={onClose} headerContent={headerContent} maxWidth="2xl">

          {/* 두 번째 행: 대화 요약 + 전문보기 버튼 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#1F1C2B]">대화 요약</h3>
            <p className="leading-relaxed text-[#6A667A]">
              이 대화에서는 주제에 대해 심도 있는 논의가 이루어졌습니다. 주요 포인트와 핵심 내용을
              중심으로 효과적인 의사소통이 진행되었습니다.
            </p>
            <Button
              variant="solid"
              size="sm"
              onClick={() => setShowTranscript(true)}
            >
              전문보기
            </Button>
          </div>

          {/* 세 번째 행: 피드백 목록 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#1F1C2B]">피드백</h3>
            <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
              {/* 피드백 아이템 예시 */}
              <div className="space-y-2 rounded-2xl bg-gray-50 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#5F51D9]">사용자 답변</p>
                  <p className="text-sm text-[#1F1C2B]">
                    &quot;I think the movie was really good and interesting.&quot;
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#7B6CF6]">더 나은 답변</p>
                  <p className="text-sm text-[#1F1C2B]">
                    &quot;I found the movie exceptionally engaging and thought-provoking.&quot;
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-gray-50 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#5F51D9]">사용자 답변</p>
                  <p className="text-sm text-[#1F1C2B]">
                    &quot;The characters was very nice.&quot;
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#7B6CF6]">더 나은 답변</p>
                  <p className="text-sm text-[#1F1C2B]">
                    &quot;The characters were remarkably well-developed and relatable.&quot;
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-gray-50 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#5F51D9]">사용자 답변</p>
                  <p className="text-sm text-[#1F1C2B]">
                    &quot;I like how the story ended.&quot;
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#7B6CF6]">더 나은 답변</p>
                  <p className="text-sm text-[#1F1C2B]">
                    &quot;I appreciated the satisfying and meaningful conclusion to the
                    narrative.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
      </PopupLayout>

      {/* 전문 스크립트 팝업 */}
      {showTranscript && (
        <ChatTranscriptPopup
          sessionTitle={session.title}
          messages={sampleMessages}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </>
  );
};

