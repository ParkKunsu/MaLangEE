import { FC } from "react";
import { TrendingUp, Award, Clock } from "lucide-react";

export interface ProgressSummaryProps {
  totalConversations?: number;
  weeklyMinutes?: number;
  achievementCount?: number;
}

export const ProgressSummary: FC<ProgressSummaryProps> = ({
  totalConversations = 0,
  weeklyMinutes = 0,
  achievementCount = 0,
}) => {
  const stats = [
    {
      icon: <TrendingUp className="h-6 w-6 text-brand" strokeWidth={2.5} />,
      label: "완료한 대화",
      value: totalConversations,
      unit: "회",
    },
    {
      icon: <Clock className="h-6 w-6 text-brand" strokeWidth={2.5} />,
      label: "이번 주 학습",
      value: weeklyMinutes,
      unit: "분",
    },
    {
      icon: <Award className="h-6 w-6 text-brand" strokeWidth={2.5} />,
      label: "획득한 뱃지",
      value: achievementCount,
      unit: "개",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 shadow-[0_10px_40px_rgba(125,106,246,0.15)] backdrop-blur-2xl">
      {/* 내부 장식 */}
      <div className="absolute -right-12 top-6 h-24 w-24 rounded-full bg-[#f6e8ff] blur-3xl" />
      <div className="absolute left-8 top-12 h-16 w-16 rounded-full bg-[#fdf4c7] blur-2xl" />

      <div className="relative p-8">
        <h2
          className="mb-6 text-2xl font-bold text-text-primary"
          style={{ letterSpacing: "-0.4px" }}
        >
          나의 학습 현황
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-2xl bg-white/40 p-4 backdrop-blur-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
                {stat.icon}
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm text-text-secondary"
                  style={{ letterSpacing: "-0.1px" }}
                >
                  {stat.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-2xl font-bold text-text-primary"
                    style={{ letterSpacing: "-0.3px" }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-sm text-text-secondary">{stat.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
