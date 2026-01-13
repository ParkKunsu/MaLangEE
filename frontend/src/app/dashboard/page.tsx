"use client";

import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Zap,
  Lightbulb,
  RefreshCw,
  BookOpen,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { AuthGuard } from "@/features/auth";
import { LearningCard, ProgressSummary, RecentActivity } from "@/widgets/dashboard";
import { Logo } from "@/shared/ui";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth/login");
  };

  // 학습 모드 데이터
  const learningModes = [
    {
      title: "시나리오 대화",
      description: "원하는 상황을 말하면 AI가 시나리오를 만들어 실시간 대화 연습을 도와줘요",
      icon: <MessageSquare className="h-8 w-8 text-brand" strokeWidth={2.5} />,
      href: "/auth/scenario-select",
      iconBgColor: "bg-brand/10",
      disabled: false,
    },
    {
      title: "Quick Response",
      description: "빠른 질문에 즉각 대답하며 반사 신경을 키워보세요",
      icon: <Zap className="h-8 w-8 text-orange-500" strokeWidth={2.5} />,
      href: "/quick-response",
      iconBgColor: "bg-orange-500/10",
      disabled: true,
    },
    {
      title: "Think Aloud",
      description: "생각하는 과정을 영어로 말하며 논리적 표현력을 향상시켜요",
      icon: <Lightbulb className="h-8 w-8 text-yellow-500" strokeWidth={2.5} />,
      href: "/think-aloud",
      iconBgColor: "bg-yellow-500/10",
      disabled: true,
    },
    {
      title: "Rephrasing",
      description: "같은 의미를 다양한 표현으로 바꿔 말하는 연습을 해보세요",
      icon: <RefreshCw className="h-8 w-8 text-green-500" strokeWidth={2.5} />,
      href: "/rephrasing",
      iconBgColor: "bg-green-500/10",
      disabled: true,
    },
    {
      title: "Daily Reflection",
      description: "하루를 돌아보며 영어로 일기를 쓰고 피드백을 받아요",
      icon: <BookOpen className="h-8 w-8 text-blue-500" strokeWidth={2.5} />,
      href: "/daily-reflection",
      iconBgColor: "bg-blue-500/10",
      disabled: true,
    },
    {
      title: "학습 진행 현황",
      description: "나의 학습 통계와 성취도를 한눈에 확인하세요",
      icon: <TrendingUp className="h-8 w-8 text-purple-500" strokeWidth={2.5} />,
      href: "/progress",
      iconBgColor: "bg-purple-500/10",
      disabled: true,
    },
  ];

  // 임시 데이터 (추후 API 연동)
  const mockActivities = [
    {
      id: "1",
      title: "카페에서 커피 주문하기",
      date: "2026-01-13T10:00:00.000Z", // 2시간 전 (고정값)
      type: "conversation" as const,
      duration: 15,
    },
    {
      id: "2",
      title: "호텔 체크인 대화",
      date: "2026-01-12T12:00:00.000Z", // 어제 (고정값)
      type: "conversation" as const,
      duration: 12,
    },
  ];

  return (
    <AuthGuard>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gradient-purple to-gradient-blue">
        {/* 배경 장식 원형들 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[5%] top-[10%] h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute right-[10%] top-[20%] h-32 w-32 rounded-full bg-[#f8f0ff] blur-3xl" />
          <div className="absolute bottom-[15%] left-[15%] h-36 w-36 rounded-full bg-[#fdf4c7] opacity-50 blur-3xl" />
          <div className="absolute bottom-[25%] right-[8%] h-28 w-28 rounded-full bg-[#d5c7ff] opacity-60 blur-3xl" />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative">
          {/* 헤더 */}
          <header className="flex items-center justify-between px-8 py-6 md:px-12">
            <Logo />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-text-secondary backdrop-blur-sm transition hover:bg-white/80 hover:text-brand"
              style={{ letterSpacing: "-0.1px" }}
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </header>

          {/* 콘텐츠 영역 */}
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-12">
            {/* 환영 메시지 */}
            <div className="mb-12">
              <h1
                className="mb-2 text-4xl font-bold text-text-primary md:text-5xl"
                style={{ letterSpacing: "-0.8px" }}
              >
                안녕하세요! 👋
              </h1>
              <p
                className="text-lg text-text-secondary md:text-xl"
                style={{ letterSpacing: "-0.2px" }}
              >
                오늘은 어떤 학습을 시작해볼까요?
              </p>
            </div>

            {/* 진행 상황 요약 */}
            <div className="mb-12">
              <ProgressSummary totalConversations={12} weeklyMinutes={85} achievementCount={3} />
            </div>

            {/* 학습 모드 그리드 */}
            <div className="mb-12">
              <h2
                className="mb-6 text-2xl font-bold text-text-primary"
                style={{ letterSpacing: "-0.4px" }}
              >
                학습 모드
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {learningModes.map((mode, index) => (
                  <LearningCard
                    key={index}
                    title={mode.title}
                    description={mode.description}
                    icon={mode.icon}
                    href={mode.href}
                    iconBgColor={mode.iconBgColor}
                    disabled={mode.disabled}
                  />
                ))}
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="mb-12">
              <RecentActivity activities={mockActivities} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
