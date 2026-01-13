"use client";

import { FC } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface LearningChartData {
  date: string;
  minutes: number;
}

export interface LearningChartProps {
  data: LearningChartData[];
  title?: string;
}

/**
 * 학습 시간 차트 위젯
 * recharts를 사용한 Area Chart
 */
export const LearningChart: FC<LearningChartProps> = ({ data, title = "주간 학습 시간" }) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 p-6 shadow-lg backdrop-blur-2xl">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.55 0.2 280)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.55 0.2 280)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.02 280)" />
          <XAxis
            dataKey="date"
            stroke="oklch(0.45 0.03 280)"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="oklch(0.45 0.03 280)"
            style={{ fontSize: "12px" }}
            label={{ value: "분", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "oklch(0.98 0.01 280)",
              border: "1px solid oklch(0.85 0.02 280)",
              borderRadius: "12px",
              fontSize: "14px",
            }}
            formatter={(value: number) => [`${value}분`, "학습 시간"]}
          />
          <Area
            type="monotone"
            dataKey="minutes"
            stroke="oklch(0.55 0.2 280)"
            strokeWidth={2}
            fill="url(#colorMinutes)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
