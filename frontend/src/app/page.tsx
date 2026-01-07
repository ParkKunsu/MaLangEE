"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

/** 배경 장식용 원형 컴포넌트 */
interface DecorativeCircleProps {
  className?: string;
  style?: React.CSSProperties;
}

function DecorativeCircle({ className, style }: DecorativeCircleProps) {
  return <div className={cn("absolute rounded-full", className)} style={style} />;
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#F6D7FF] to-[#DCE9FF]">
      {/* 배경 장식 원형들 */}
      <DecorativeCircle
        className="h-20 w-20"
        style={{
          left: "36.7%",
          top: "80.8%",
          background: "linear-gradient(37deg, rgba(213, 220, 255, 1) 0%, rgba(232, 157, 255, 1) 96%)",
        }}
      />
      <DecorativeCircle
        className="h-28 w-28"
        style={{
          left: "68.3%",
          top: "11.5%",
          background: "linear-gradient(127deg, rgba(232, 157, 255, 1) 12%, rgba(213, 220, 255, 1) 100%)",
        }}
      />
      <DecorativeCircle
        className="h-64 w-64"
        style={{
          left: "8.8%",
          top: "38.2%",
          background: "linear-gradient(145deg, rgba(228, 241, 255, 1) 10%, rgba(253, 255, 199, 1) 92%)",
        }}
      />
      <DecorativeCircle
        className="h-[865px] w-[865px]"
        style={{
          left: "66.5%",
          top: "56.2%",
          background: "linear-gradient(-53deg, rgba(232, 157, 255, 1) 0%, rgba(213, 220, 255, 1) 88%)",
        }}
      />

      {/* 메인 콘텐츠 */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* 로고/아이콘 영역 */}
        <Card className="mb-6 flex h-32 w-32 items-center justify-center border-none bg-muted shadow-none">
          <span className="text-5xl" role="img" aria-label="chat icon">
            💬
          </span>
        </Card>

        {/* 서브타이틀 */}
        <p className="mb-2 text-center text-2xl tracking-tight text-foreground">
          Free Talking AI Chat-bot
        </p>

        {/* 메인 타이틀 */}
        <h1 className="mb-16 text-center text-5xl font-bold leading-tight tracking-tight text-foreground">
          해외 원어민과
          <br />
          대화하는 느낌 그대로!
        </h1>

        {/* 버튼 그룹 */}
        <nav className="flex w-full max-w-[360px] flex-col gap-5">
          <Button variant="brand" size="xl" className="w-full font-bold" asChild>
            <Link href="/auth/login">로그인하기</Link>
          </Button>
          <Button variant="brand-outline" size="xl" className="w-full font-semibold" asChild>
            <Link href="/dashboard">무료로 트라이</Link>
          </Button>
        </nav>
      </section>
    </main>
  );
}
