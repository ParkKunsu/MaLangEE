"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";

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
      {/* 배경 장식 원형들 - 모바일에서 크기 조정 */}
      <DecorativeCircle
        className="h-12 w-12 sm:h-20 sm:w-20"
        style={{
          left: "36.7%",
          top: "80.8%",
          background:
            "linear-gradient(37deg, rgba(213, 220, 255, 1) 0%, rgba(232, 157, 255, 1) 96%)",
        }}
      />
      <DecorativeCircle
        className="h-16 w-16 sm:h-28 sm:w-28"
        style={{
          left: "68.3%",
          top: "11.5%",
          background:
            "linear-gradient(127deg, rgba(232, 157, 255, 1) 12%, rgba(213, 220, 255, 1) 100%)",
        }}
      />
      <DecorativeCircle
        className="h-32 w-32 sm:h-48 sm:w-48 md:h-64 md:w-64"
        style={{
          left: "8.8%",
          top: "38.2%",
          background:
            "linear-gradient(145deg, rgba(228, 241, 255, 1) 10%, rgba(253, 255, 199, 1) 92%)",
        }}
      />
      <DecorativeCircle
        className="h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] md:h-[865px] md:w-[865px]"
        style={{
          left: "66.5%",
          top: "56.2%",
          background:
            "linear-gradient(-53deg, rgba(232, 157, 255, 1) 0%, rgba(213, 220, 255, 1) 88%)",
        }}
      />

      {/* 메인 콘텐츠 */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        {/* 로고/아이콘 영역 */}
        <Image
          src="/images/malangee.svg"
          alt="MalangEE mascot"
          width={128}
          height={128}
          priority
          className="h-20 w-20 object-contain"
        />

        {/* 서브타이틀 */}
        <p className="text-foreground mb-1.5 text-center text-base tracking-tight sm:mb-2 sm:text-lg md:text-2xl">
          Free Talking AI Chat-bot
        </p>

        {/* 메인 타이틀 */}
        <h1 className="text-foreground mb-8 text-center text-2xl font-bold leading-tight tracking-tight sm:mb-10 sm:text-3xl md:mb-12 md:text-4xl lg:mb-16 lg:text-5xl">
          해외 원어민과
          <br />
          대화하는 느낌 그대로!
        </h1>

        {/* 버튼 그룹 */}
        <nav className="flex w-full max-w-[320px] flex-col gap-3 sm:max-w-[360px] sm:gap-4 md:gap-5">
          <Button
            variant="brand"
            size="xl"
            className="w-full text-sm font-bold sm:text-base md:text-lg"
            asChild
          >
            <Link href="/auth/login">로그인하기</Link>
          </Button>
          <Button
            variant="brand-outline"
            size="xl"
            className="w-full text-sm font-semibold sm:text-base md:text-lg"
            asChild
          >
            <Link href="/dashboard">무료로 트라이</Link>
          </Button>
        </nav>
      </section>
    </main>
  );
}
