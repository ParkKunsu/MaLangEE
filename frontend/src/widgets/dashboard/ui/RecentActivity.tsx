import { FC } from "react";
import Link from "next/link";
import { MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/shared/ui";

export interface ActivityItem {
  id: string;
  title: string;
  date: string;
  type: "conversation" | "reflection";
  duration?: number; // 분 단위
}

export interface RecentActivityProps {
  activities?: ActivityItem[];
}

export const RecentActivity: FC<RecentActivityProps> = ({ activities = [] }) => {
  const getTypeIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "conversation":
        return <MessageSquare className="h-5 w-5 text-brand" strokeWidth={2} />;
      case "reflection":
        return <Calendar className="h-5 w-5 text-brand" strokeWidth={2} />;
      default:
        return <MessageSquare className="h-5 w-5 text-brand" strokeWidth={2} />;
    }
  };

  const getTypeLabel = (type: ActivityItem["type"]) => {
    switch (type) {
      case "conversation":
        return "대화";
      case "reflection":
        return "반성 일지";
      default:
        return "활동";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 48) return "어제";
    return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  };

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 shadow-[0_10px_40px_rgba(125,106,246,0.15)] backdrop-blur-2xl">
      {/* 내부 장식 */}
      <div className="absolute -left-12 bottom-8 h-24 w-24 rounded-full bg-[#f6e8ff] blur-3xl" />
      <div className="absolute right-8 top-8 h-16 w-16 rounded-full bg-[#fdf4c7] blur-2xl" />

      <div className="relative p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-2xl font-bold text-text-primary"
            style={{ letterSpacing: "-0.4px" }}
          >
            최근 활동
          </h2>
          <Link href="/chat-history">
            <Button variant="ghost" size="sm">
              전체보기
            </Button>
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <MessageSquare className="h-8 w-8 text-brand/50" />
            </div>
            <p
              className="text-center text-sm text-text-secondary"
              style={{ letterSpacing: "-0.1px" }}
            >
              아직 활동 내역이 없습니다.
              <br />
              첫 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-2xl bg-white/40 p-4 backdrop-blur-sm transition-colors hover:bg-white/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="font-semibold text-text-primary"
                      style={{ letterSpacing: "-0.2px" }}
                    >
                      {activity.title}
                    </span>
                    {activity.duration && (
                      <span className="text-xs text-text-secondary">· {activity.duration}분</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{getTypeLabel(activity.type)}</span>
                    <span className="text-xs text-text-secondary">·</span>
                    <span className="text-xs text-text-secondary">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
