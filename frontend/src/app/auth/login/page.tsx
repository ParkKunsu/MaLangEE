"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { useEffect, useState } from "react";
import { SplitViewLayout } from "@/shared/ui/SplitViewLayout";
import { Button } from "@/shared/ui";
import { type LoginFormData, loginSchema, useLogin } from "@/features/auth";

// safeParse를 사용하는 커스텀 resolver (콘솔 에러 방지)
const loginResolver: Resolver<LoginFormData> = async (values) => {
  const result = loginSchema.safeParse(values);

  if (result.success) {
    return { values: result.data, errors: {} };
  }

  const errors: Record<string, { type: string; message: string }> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (path) {
      errors[path] = {
        type: issue.code,
        message: issue.message,
      };
    }
  });

  return { values: {}, errors };
};

export default function LoginPage() {
  const router = useRouter();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [activeTitleIndex, setActiveTitleIndex] = useState(0);
  const titleRotationMs = 4000;


  const titleMessages = [
    {
      top: "Talk like there",
      headingLine1: "그 상황에",
      headingLine2: "있는 것처럼 말해요",
    },
    {
      top: "Need help? Get hints",
      headingLine1: "막히면",
      headingLine2: "말랭이가 힌트를 줘요",
    },
    {
      top: "Your pace, your talk",
      headingLine1: "말랭이가",
      headingLine2: "내 템포에 맞춰줘요",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTitleIndex((prev) => (prev + 1) % titleMessages.length);
    }, titleRotationMs);

    return () => clearInterval(interval);
  }, [titleMessages.length, titleRotationMs]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: loginResolver,
  });

  const loginMutation = useLogin();

  const onSubmit = (data: LoginFormData) => {
    // 방어적 유효성 검증(콘솔 에러 방지)
    const result = loginSchema.safeParse(data);
    if (!result.success) return;

    loginMutation.mutate(data);
  };

  const handleFindClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowComingSoonModal(true);
  };

  // 왼쪽 콘텐츠
  const leftContent = (
    <div className="space-y-7 md:space-y-9">
      <div className="space-y-2" id={"title-wrapper"} key={activeTitleIndex}>
        <p className="text-brand-400 title-rotate mb-4 text-xl" style={{ letterSpacing: "-0.2px" }}>
          {titleMessages[activeTitleIndex].top}
        </p>
        <h1
          className="title-rotate text-4xl font-bold leading-snug tracking-tight"
          style={{ letterSpacing: "-0.96px" }}
        >
          {titleMessages[activeTitleIndex].headingLine1}
          <br />
          {titleMessages[activeTitleIndex].headingLine2}
        </h1>
      </div>

      <div className="flex items-center gap-2" id={"icon-wrapper"}>
        {titleMessages.map((_, index) => (
          <div
            key={index}
            onClick={() => setActiveTitleIndex(index)}
            className={
              index === activeTitleIndex
                ? "bg-brand h-3 w-10 cursor-pointer rounded-full transition-all duration-300"
                : "h-3 w-3 cursor-pointer rounded-full bg-white/90 transition-all duration-300"
            }
          />
        ))}
      </div>
    </div>
  );

  // 오른쪽 콘텐츠(로그인 폼)
  const rightContent = (
    <div className="mx-auto w-full space-y-7 md:space-y-9">
      <p className="mb-15 text-3xl font-semibold leading-snug md:text-4xl">
        Hello,
        <br />
        I&#39;m MalangEE
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-6 ">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="relative">
            <input
              id="username"
              type="text"
              placeholder="아이디"
              {...register("username")}
              className="border-border-light text-text-primary placeholder:text-placeholder focus:border-brand focus:ring-brand-200 h-[56px] w-full rounded-full border bg-white px-5 text-base shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2"
              style={{ letterSpacing: "-0.2px" }}
            />
            {errors.username && (
              <p className="mt-2 whitespace-nowrap px-1 text-sm text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="비밀번호"
              {...register("password")}
              className="border-border-light text-text-primary placeholder:text-placeholder focus:border-brand focus:ring-brand-200 h-[56px] w-full rounded-full border bg-white px-5 text-base shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2"
              style={{ letterSpacing: "-0.2px" }}
            />
            {errors.password && (
              <p className="mt-2 whitespace-nowrap px-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="text-text-secondary flex flex-col gap-3 px-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <a
            href="#"
            onClick={handleFindClick}
            className="hover:text-brand"
            style={{ letterSpacing: "-0.1px" }}
          >
            아이디/비밀번호 찾기
          </a>
          <Link
            href="/auth/signup"
            className="hover:text-brand"
            style={{ letterSpacing: "-0.1px" }}
          >
            회원가입
          </Link>
        </div>

        {loginMutation.isError && (
          <p className="whitespace-nowrap px-1 text-center text-sm text-red-500">
            {loginMutation.error.message || "로그인에 실패했습니다"}
          </p>
        )}

        <div className="flex flex-col gap-4 sm:gap-5">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loginMutation.isPending}
          >
            {loginMutation.isPending ? "로그인 중.." : "로그인"}
          </Button>

          <Button
            type="button"
            variant="outline-purple"
            size="lg"
            fullWidth
            onClick={() => router.push("/chat/scenario-select")}
          >
            바로 체험해보기
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <SplitViewLayout
        leftChildren={leftContent}
        rightChildren={rightContent}
        showHeader={false}
        maxWidth="md:max-w-6xl"
        leftColSpan={5}
        rightColSpan={7}
        glassClassName="p-6 md:p-10"
        glassMaxWidth="max-w-full md:max-w-2xl lg:max-w-4xl"
      />

      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="to-brand-50/80 relative mx-4 w-full max-w-sm rounded-[24px] border border-white/60 bg-gradient-to-br from-white/90 via-white/80 shadow-[0_20px_80px_rgba(125,106,246,0.3)] backdrop-blur-2xl">
            <div className="space-y-6 px-8 py-8">
              <div className="space-y-2">
                <p className="text-text-primary text-center text-2xl font-semibold">준비중입니다</p>
                <p
                  className="text-text-secondary text-center text-sm"
                  style={{ letterSpacing: "-0.1px" }}
                >
                  해당 기능은 현재 준비중입니다.
                  <br />
                  조금만 기다려주세요!
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setShowComingSoonModal(false)}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
