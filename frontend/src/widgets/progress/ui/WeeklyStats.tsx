"use client";

import { FC } from "react";
import { Clock, MessageSquare, Zap, TrendingUp } from "lucide-react";

export interface WeeklyStatsData {
  totalMinutes: number;
  totalSessions: number;
  averageScore: number;
  improvement: number; // 전주 대비 증가율 (%)
}

export interface WeeklyStatsProps {
  data: WeeklyStatsData;
}

/**
 * 주간 통계 위젯
 * 이번 주 학습 성과 요약
 */
export const WeeklyStats: FC<WeeklyStatsProps> = ({ data }) => {
  const stats = [
    {
      icon: Clock,
      label: "학습 시간",
      value: `${data.totalMinutes}분`,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: MessageSquare,
      label: "대화 횟수",
      value: `${data.totalSessions}회`,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: Zap,
      label: "평균 점수",
      value: `${data.averageScore}점`,
      color: "text-brand",
      bgColor: "bg-brand-50",
    },
    {
      icon: TrendingUp,
      label: "성장률",
      value: `+${data.improvement}%`,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 p-6 shadow-lg backdrop-blur-2xl">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">이번 주 통계</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-3 rounded-2xl bg-white/50 p-4 transition hover:bg-white/70"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="mt-1 text-xs text-text-secondary">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
