import { FC, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface LearningCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  iconBgColor?: string;
  disabled?: boolean;
}

export const LearningCard: FC<LearningCardProps> = ({
  title,
  description,
  icon,
  href,
  iconBgColor = "bg-brand/10",
  disabled = false,
}) => {
  const cardContent = (
    <div
      className={`
        group relative overflow-hidden rounded-[24px] border border-white/60
        bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80
        shadow-[0_10px_40px_rgba(125,106,246,0.15)]
        backdrop-blur-2xl transition-all duration-300
        ${disabled ? "cursor-not-allowed opacity-60" : "hover:shadow-[0_20px_60px_rgba(125,106,246,0.25)] hover:scale-[1.02]"}
      `}
    >
      {/* 내부 장식 */}
      <div className="absolute -left-8 top-8 h-20 w-20 rounded-full bg-[#f6e8ff] blur-2xl" />
      <div className="absolute right-6 top-4 h-12 w-12 rounded-full bg-[#fdf4c7] blur-xl" />

      <div className="relative flex flex-col gap-6 p-8">
        {/* 아이콘 */}
        <div
          className={`
            flex h-16 w-16 items-center justify-center rounded-2xl
            ${iconBgColor} shadow-md transition-transform
            ${!disabled && "group-hover:scale-110"}
          `}
        >
          {icon}
        </div>

        {/* 텍스트 콘텐츠 */}
        <div className="space-y-2">
          <h3
            className="text-xl font-bold text-text-primary"
            style={{ letterSpacing: "-0.3px" }}
          >
            {title}
          </h3>
          <p
            className="text-sm leading-relaxed text-text-secondary"
            style={{ letterSpacing: "-0.1px" }}
          >
            {description}
          </p>
        </div>

        {/* 화살표 아이콘 */}
        {!disabled && (
          <div className="flex items-center justify-end">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 transition-colors group-hover:bg-brand">
              <ArrowRight className="h-5 w-5 text-brand transition-colors group-hover:text-white" />
            </div>
          </div>
        )}

        {/* 준비중 배지 */}
        {disabled && (
          <div className="absolute right-4 top-4 rounded-full bg-text-secondary/20 px-3 py-1">
            <span className="text-xs font-medium text-text-secondary">준비중</span>
          </div>
        )}
      </div>
    </div>
  );

  if (disabled) {
    return cardContent;
  }

  return (
    <Link href={href} className="block">
      {cardContent}
    </Link>
  );
};
