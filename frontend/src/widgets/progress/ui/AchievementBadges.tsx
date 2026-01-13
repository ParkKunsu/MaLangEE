"use client";

import { FC } from "react";
import { Trophy, Flame, Target, Award } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: "trophy" | "flame" | "target" | "award";
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface AchievementBadgesProps {
  achievements: Achievement[];
}

const iconMap = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  award: Award,
};

/**
 * 업적 뱃지 위젯
 * 학습 목표 달성 배지 표시
 */
export const AchievementBadges: FC<AchievementBadgesProps> = ({ achievements }) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 p-6 shadow-lg backdrop-blur-2xl">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">업적 뱃지</h3>

      {achievements.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          아직 획득한 뱃지가 없습니다.
          <br />
          학습을 시작하고 첫 뱃지를 획득해보세요!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {achievements.map((achievement) => {
            const Icon = iconMap[achievement.icon];

            return (
              <div
                key={achievement.id}
                className={`
                  group relative flex flex-col items-center gap-2 rounded-2xl p-4 transition-all
                  ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-brand/10 to-brand/5 hover:scale-105"
                      : "opacity-40 grayscale"
                  }
                `}
              >
                <div
                  className={`
                    flex h-16 w-16 items-center justify-center rounded-full
                    ${
                      achievement.unlocked
                        ? "bg-brand/20 shadow-lg"
                        : "bg-gray-200"
                    }
                  `}
                >
                  <Icon
                    className={`
                      h-8 w-8
                      ${achievement.unlocked ? "text-brand" : "text-gray-400"}
                    `}
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs font-semibold text-text-primary">
                    {achievement.name}
                  </p>
                  <p className="mt-1 text-[10px] text-text-secondary">
                    {achievement.description}
                  </p>
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand shadow-md">
                    <span className="text-[10px] font-bold text-white">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
