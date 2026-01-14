"use client";

import React, { useState, useMemo } from "react";
import type { ChatHistoryItem } from "@/shared/types/chat";
import { ChatTranscriptPopup } from "./ChatTranscriptPopup";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { Button } from "@/shared/ui";
import { useGetChatSession } from "@/features/chat";

interface ChatDetailPopupProps {
  session: ChatHistoryItem;
  onClose: () => void;
}

export const ChatDetailPopup: React.FC<ChatDetailPopupProps> = ({ session, onClose }) => {
  const [showTranscript, setShowTranscript] = useState(false);

  // 실제 API에서 세션 상세 정보 조회
  const { data: sessionDetail, isLoading } = useGetChatSession(session.id);

  // 메시지 데이터 변환
  const messages = useMemo(() => {
    if (!sessionDetail?.messages) return [];
    return sessionDetail.messages.map((msg) => {
      const timestamp = new Date(msg.timestamp);
      const timeStr = `${String(timestamp.getHours()).padStart(2, "0")}:${String(timestamp.getMinutes()).padStart(2, "0")}`;
      return {
        speaker: msg.role === "assistant" ? "말랭이" : "사용자",
        content: msg.content,
        timestamp: timeStr,
      };
    });
  }, [sessionDetail]);

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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5F51D9] border-t-transparent" />
            </div>
          ) : (
            <>
              {/* 두 번째 행: 대화 요약 + 전문보기 버튼 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#1F1C2B]">대화 요약</h3>
                <p className="leading-relaxed text-[#6A667A]">
                  {messages.length > 0
                    ? `이 대화에서는 ${messages.length}개의 메시지가 오갔습니다. ${session.title} 주제로 효과적인 의사소통이 진행되었습니다.`
                    : "대화 내용이 없습니다."}
                </p>
                <Button
                  variant="solid"
                  size="sm"
                  onClick={() => setShowTranscript(true)}
                  disabled={messages.length === 0}
                >
                  전문보기
                </Button>
              </div>

              {/* 세 번째 행: 피드백 목록 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1F1C2B]">피드백</h3>
                <div className="flex items-center justify-center rounded-2xl bg-gray-50 p-8">
                  <p className="text-sm text-[#6A667A]">
                    피드백 기능은 곧 제공될 예정입니다.
                  </p>
                </div>
              </div>
            </>
          )}
      </PopupLayout>

      {/* 전문 스크립트 팝업 */}
      {showTranscript && (
        <ChatTranscriptPopup
          sessionTitle={session.title}
          messages={messages}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </>
  );
};

