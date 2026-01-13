"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/features/auth";
import {
  LearningChart,
  AchievementBadges,
  WeeklyStats,
  LearningHistory,
  type LearningChartData,
  type Achievement,
  type WeeklyStatsData,
  type LearningHistoryItem,
} from "@/widgets/progress";
import { ArrowLeft, TrendingUp } from "lucide-react";

// 샘플 데이터
const SAMPLE_CHART_DATA: LearningChartData[] = [
  { date: "월", minutes: 25 },
  { date: "화", minutes: 40 },
  { date: "수", minutes: 35 },
  { date: "목", minutes: 50 },
  { date: "금", minutes: 45 },
  { date: "토", minutes: 60 },
  { date: "일", minutes: 30 },
];

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: "1",
    name: "첫 걸음",
    description: "첫 대화 완료",
    icon: "trophy",
    unlocked: true,
    unlockedAt: new Date(),
  },
  {
    id: "2",
    name: "열정",
    description: "7일 연속 학습",
    icon: "flame",
    unlocked: true,
    unlockedAt: new Date(),
  },
  {
    id: "3",
    name: "목표 달성",
    description: "주간 목표 완료",
    icon: "target",
    unlocked: false,
  },
  {
    id: "4",
    name: "완벽주의",
    description: "90점 이상 10회",
    icon: "award",
    unlocked: false,
  },
];

const SAMPLE_WEEKLY_STATS: WeeklyStatsData = {
  totalMinutes: 285,
  totalSessions: 12,
  averageScore: 85,
  improvement: 15,
};

const SAMPLE_HISTORY: LearningHistoryItem[] = [
  {
    id: "1",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    mode: "Quick Response",
    duration: 15,
    score: 88,
    title: "빠른 응답 연습",
  },
  {
    id: "2",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    mode: "시나리오 대화",
    duration: 20,
    score: 92,
    title: "카페에서 주문하기",
  },
  {
    id: "3",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    mode: "Think Aloud",
    duration: 25,
    score: 85,
    title: "문제 해결 연습",
  },
];

const ProgressPage: FC = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <AuthGuard>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gradient-purple to-gradient-blue">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[15%] h-32 w-32 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute right-[15%] top-[25%] h-24 w-24 rounded-full bg-[#f8f0ff] blur-2xl" />
          <div className="absolute bottom-[20%] left-[20%] h-28 w-28 rounded-full bg-[#fdf4c7] opacity-60 blur-3xl" />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative flex min-h-screen flex-col">
          {/* 헤더 */}
          <header className="flex items-center justify-between px-8 py-6 md:px-12">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              대시보드로 돌아가기
            </button>
            <div className="flex items-center gap-2 text-brand">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-semibold">학습 진행 현황</span>
            </div>
          </header>

          {/* 콘텐츠 영역 */}
          <div className="flex-1 px-6 pb-12 md:px-12">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* 페이지 타이틀 */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white md:text-4xl">
                  학습 진행 현황
                </h1>
                <p className="mt-2 text-lg text-white/80">
                  당신의 성장을 확인해보세요
                </p>
              </div>

              {/* 주간 통계 */}
              <WeeklyStats data={SAMPLE_WEEKLY_STATS} />

              {/* 차트와 업적 */}
              <div className="grid gap-6 lg:grid-cols-2">
                <LearningChart data={SAMPLE_CHART_DATA} />
                <AchievementBadges achievements={SAMPLE_ACHIEVEMENTS} />
              </div>

              {/* 학습 기록 */}
              <LearningHistory items={SAMPLE_HISTORY} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default ProgressPage;
