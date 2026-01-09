"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { authApi } from "@/shared/api/auth";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data.username, data.password),
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      router.push("/dashboard");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };

  const handleFindClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowComingSoonModal(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-[#1F1C2B]">
      <Image
        src="/images/login-bg-01.png"
        alt="Background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 bottom-10 h-32 w-32 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute right-10 top-16 h-24 w-24 rounded-full bg-[#f8f0ff] blur-2xl" />
        <div className="absolute right-24 bottom-20 h-24 w-24 rounded-full bg-[#d5c7ff] blur-2xl opacity-60" />
        <div className="absolute left-10 top-24 h-20 w-20 rounded-full bg-[#fdf4c7] blur-2xl opacity-70" />
        <div className="absolute left-32 bottom-36 h-16 w-16 rounded-full bg-[#eecbff] blur-xl opacity-70" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12 md:flex-row md:items-center md:gap-16 md:px-12">
        <div className="flex flex-1 flex-col items-start gap-8">
          <div className="text-xl font-semibold text-[#5F51D9]" style={{ letterSpacing: "-0.3px" }}>
            MalangEE
          </div>

          <div className="relative flex items-center gap-6">
            <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-white/60 blur-3xl" />
            <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-[#fdf4c7] blur-2xl opacity-70" />
            <div className="relative flex h-32 w-32 items-center justify-center ">
              <Image
                src="/images/mascot.svg"
                alt="MalangEE mascot"
                width={128}
                height={128}
                priority
                className="h-32 w-32 object-contain"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-lg text-[#4b3f74]" style={{ letterSpacing: "-0.2px" }}>
              Free Talking AI Chat-bot
            </p>
            <h1 className="text-4xl font-bold leading-snug tracking-tight md:text-[46px]" style={{ letterSpacing: "-0.96px" }}>
              해외 원어민과
              <br />
              대화하는 느낌 그대로!
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-3 w-10 rounded-full bg-[#7B6CF6]" />
            <div className="h-3 w-3 rounded-full bg-white/90" />
            <div className="h-3 w-3 rounded-full bg-white/90" />
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute -left-10 bottom-6 h-24 w-24 rounded-full bg-[#c6d5ff]/60 blur-3xl" />
          <div className="absolute -right-6 top-10 h-24 w-24 rounded-full bg-[#f2d8ff]/60 blur-3xl" />

          <div className="relative w-full max-w-[540px] overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-[#f0e8ff]/80 shadow-[0_20px_80px_rgba(125,106,246,0.25)] backdrop-blur-2xl">
            <div className="absolute -left-12 top-12 h-28 w-28 rounded-full bg-[#f6e8ff] blur-3xl" />
            <div className="absolute right-10 top-6 h-16 w-16 rounded-full bg-[#fdf4c7] blur-2xl" />

            <div className="relative space-y-8 px-8 py-10 md:px-12 md:py-12">
              <div className="space-y-2">
                <p className="text-3xl font-semibold leading-snug md:text-4xl">
                  Hello,<br />I&#39;m MalangEE
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      placeholder="아이디"
                      {...register("username")}
                      className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] placeholder:text-[#8c869c] shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                      style={{ letterSpacing: "-0.2px" }}
                    />
                    {errors.username && <p className="mt-2 px-1 text-sm text-red-500">{errors.username.message}</p>}
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      placeholder="비밀번호"
                      {...register("password")}
                      className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] placeholder:text-[#8c869c] shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                      style={{ letterSpacing: "-0.2px" }}
                    />
                    {errors.password && <p className="mt-2 px-1 text-sm text-red-500">{errors.password.message}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 text-sm text-[#625a75]">
                  <a href="#" onClick={handleFindClick} className="hover:text-[#7B6CF6]" style={{ letterSpacing: "-0.1px" }}>
                    아이디/비밀번호 찾기
                  </a>
                  <Link href="/auth/signup" className="hover:text-[#7B6CF6]" style={{ letterSpacing: "-0.1px" }}>
                    회원가입
                  </Link>
                </div>

                {mutation.isError && (
                  <p className="px-1 text-center text-sm text-red-500">
                    {mutation.error instanceof Error ? mutation.error.message : "로그인에 실패했습니다"}
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="h-[56px] w-full rounded-full bg-[#7666f5] text-base font-semibold text-white shadow-[0_10px_30px_rgba(118,102,245,0.35)] transition hover:bg-[#6758e8] disabled:opacity-60"
                  >
                    {mutation.isPending ? "로그인 중..." : "로그인"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/chat")}
                    className="h-[56px] w-full rounded-full border-2 border-[#7B6CF6] bg-white text-base font-semibold text-[#7B6CF6] transition hover:bg-[#f6f4ff]"
                  >
                    바로 대화해보기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[24px] border border-white/60 bg-gradient-to-br from-white/90 via-white/80 to-[#f0e8ff]/80 shadow-[0_20px_80px_rgba(125,106,246,0.3)] backdrop-blur-2xl mx-4">
            <div className="space-y-6 px-8 py-8">
              <div className="space-y-2">
                <p className="text-center text-2xl font-semibold text-[#1F1C2B]">
                  준비중입니다
                </p>
                <p className="text-center text-sm text-[#625a75]" style={{ letterSpacing: "-0.1px" }}>
                  해당 기능은 현재 준비 중입니다.<br />
                  조금만 기다려주세요!
                </p>
              </div>
              <button
                onClick={() => setShowComingSoonModal(false)}
                className="h-[48px] w-full rounded-full bg-[#7666f5] text-base font-semibold text-white shadow-[0_10px_30px_rgba(118,102,245,0.35)] transition hover:bg-[#6758e8]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
