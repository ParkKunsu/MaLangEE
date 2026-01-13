"use client";

import { FC } from "react";
import { Clock, Calendar } from "lucide-react";

export interface LearningHistoryItem {
  id: string;
  date: string;
  mode: string;
  duration: number; // 분
  score?: number;
  title: string;
}

export interface LearningHistoryProps {
  items: LearningHistoryItem[];
}

/**
 * 학습 기록 타임라인 위젯
 * 최근 학습 활동 목록
 */
export const LearningHistory: FC<LearningHistoryProps> = ({ items }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays === 1) return "어제";
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 p-6 shadow-lg backdrop-blur-2xl">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">학습 기록</h3>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Calendar className="h-12 w-12 text-text-secondary opacity-30" />
          <p className="text-sm text-text-secondary">학습 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 rounded-2xl bg-white/50 p-4 transition hover:bg-white/70"
            >
              {/* 날짜 인디케이터 */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Calendar className="h-5 w-5 text-brand" />
              </div>

              {/* 내용 */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-primary">{item.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{item.mode}</p>
                  </div>
                  {item.score !== undefined && (
                    <div className="flex-shrink-0 rounded-lg bg-brand/10 px-2 py-1">
                      <span className="text-xs font-semibold text-brand">
                        {item.score}점
                      </span>
                    </div>
                  )}
                </div>

                {/* 메타 정보 */}
                <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{item.duration}분</span>
                  </div>
                  <div>
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
