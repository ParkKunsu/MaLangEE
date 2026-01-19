"use client";

import React, { useState, useMemo } from "react";
import type { ChatHistoryItem } from "@/shared/types/chat";
import { ChatTranscriptPopup } from "./ChatTranscriptPopup";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { Button } from "@/shared/ui";
import { useGetChatSession } from "@/features/chat";
import { useRouter } from "next/navigation";

interface ChatDetailPopupProps {
  session: ChatHistoryItem;
  onClose: () => void;
}

export const ChatDetailPopup: React.FC<ChatDetailPopupProps> = ({ session, onClose }) => {
  const router = useRouter();
  const [showTranscript, setShowTranscript] = useState(false);

  // 실제 API에서 세션 상세 정보 조회
  const { data: sessionDetail, isLoading, isError, error } = useGetChatSession(session.id);

  // 메시지 데이터 변환
  const messages = useMemo(() => {
    if (!sessionDetail?.messages) return [];
    return sessionDetail.messages.map((msg) => {
      const timestamp = new Date(msg.timestamp);
      const timeStr = `${String(timestamp.getHours()).padStart(2, "0")}:${String(timestamp.getMinutes()).padStart(2, "0")}`;
      return {
        speaker: msg.role === "assistant" ? "말랭이" : "나",
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

  const hasScenarioInfo = sessionDetail?.scenario_partner ||
    sessionDetail?.scenario_place ||
    sessionDetail?.scenario_goal;

  return (
    <>
      <PopupLayout onClose={onClose} headerContent={headerContent} maxWidth="2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5F51D9] border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-center font-medium text-red-500">
              대화 내용을 불러오는 중 오류가 발생했습니다.
              <br />
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </p>
            <Button variant="outline" size="sm" onClick={onClose}>
              닫기
            </Button>
          </div>
        ) : (
          <>
            {/* 첫 번째 행: 시나리오 정보 (있을 경우에만) */}
            {hasScenarioInfo && (
              <div className="mb-6 space-y-3 rounded-2xl bg-gray-50 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#1F1C2B]">시나리오 정보</h3>
                  <div id="scenario-info-actions" className="flex items-center gap-2">
                    <Button
                      variant="solid"
                      size="sm"
                      onClick={() => setShowTranscript(true)}
                      disabled={messages.length === 0}
                    >
                      전문보기
                    </Button>
                    <Button
                      variant="outline-purple"
                      size="sm"
                      onClick={() => router.push(`/chat/welcome-back?sessionId=${session.id}`)}
                    >
                      다시 대화하기
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {sessionDetail.scenario_partner && (
                    <div className="flex gap-2">
                      <span className="font-medium text-[#6A667A]">대화 상대:</span>
                      <span className="text-[#1F1C2B]">{sessionDetail.scenario_partner}</span>
                    </div>
                  )}
                  {sessionDetail.scenario_place && (
                    <div className="flex gap-2">
                      <span className="font-medium text-[#6A667A]">장소:</span>
                      <span className="text-[#1F1C2B]">{sessionDetail.scenario_place}</span>
                    </div>
                  )}
                  {sessionDetail.scenario_goal && (
                    <div className="col-span-full flex gap-2">
                      <span className="shrink-0 font-medium text-[#6A667A]">미션:</span>
                      <span className="text-[#1F1C2B]">{sessionDetail.scenario_goal}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 두 번째 행: 대화 요약 + 전문보기 버튼 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#1F1C2B]">대화 요약</h3>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <p className="flex-1 leading-relaxed text-[#6A667A]">
                  {sessionDetail?.scenario_summary ||
                    (messages.length > 0
                      ? `이 대화에서는 ${messages.length}개의 메시지가 오갔습니다. ${session.title} 주제로 효과적인 의사소통이 진행되었습니다.`
                      : "대화 내용이 없습니다.")}
                </p>
                <div className="flex shrink-0 gap-2">
                  {!hasScenarioInfo && (
                    <>
                      <Button
                        variant="solid"
                        size="sm"
                        onClick={() => setShowTranscript(true)}
                        disabled={messages.length === 0}
                      >
                        전문보기
                      </Button>
                      <Button
                        variant="outline-purple"
                        size="sm"
                        onClick={() => router.push(`/chat/welcome-back?sessionId=${session.id}`)}
                      >
                        다시 대화하기
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 세 번째 행: 피드백 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#1F1C2B]">피드백</h3>
              <div className="max-h-[300px] overflow-y-auto rounded-2xl bg-gray-50 p-8">
                <p className="whitespace-pre-wrap text-sm text-[#6A667A]">
                  {sessionDetail?.feedback || "피드백이 없습니다."}
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
