"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { authApi } from "@/shared/api/auth";
import { useState, useEffect } from "react";

const registerSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(10, "영문+숫자 조합 10자리 이상 입력해주세요"),
  nickname: z.string().min(1, "닉네임을 입력해주세요"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchUsername = watch("username");
  const watchNickname = watch("nickname");

  // 아이디 중복확인
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (watchUsername && watchUsername.length > 0) {
        setCheckingUsername(true);
        try {
          const result = await authApi.checkLoginId(watchUsername);
          if (!result.available) {
            setUsernameError("이미 사용중인 아이디입니다");
          } else {
            setUsernameError(null);
          }
        } catch (_error) {
          setUsernameError("아이디 확인 중 오류가 발생했습니다");
        } finally {
          setCheckingUsername(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchUsername]);

  // 닉네임 중복확인
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (watchNickname && watchNickname.length > 0) {
        setCheckingNickname(true);
        try {
          const result = await authApi.checkNickname(watchNickname);
          if (!result.available) {
            setNicknameError("이미 사용중인 닉네임입니다");
          } else {
            setNicknameError(null);
          }
        } catch (_error) {
          setNicknameError("닉네임 확인 중 오류가 발생했습니다");
        } finally {
          setCheckingNickname(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchNickname]);

  const mutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      authApi.register(data.username, data.nickname, data.password),
    onSuccess: () => {
      router.push("/auth/login");
    },
    onError: (error) => {
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("이미")) {
          setValidationError(message);
        } else {
          setValidationError("회원가입에 실패했습니다. 입력 정보를 확인해주세요.");
        }
      }
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setValidationError(null);

    // 유효성 검사 오류가 있는지 확인
    if (usernameError || nicknameError) {
      setValidationError("아이디 또는 닉네임을 확인해주세요");
      return;
    }

    mutation.mutate(data);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-[#1F1C2B]">
      <Image
        src="/images/login-bg-02.png"
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

      <div className="relative flex min-h-screen w-full items-center justify-center px-6 py-12">
        <div className="relative w-full max-w-[540px] overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-[#f0e8ff]/80 shadow-[0_20px_80px_rgba(125,106,246,0.25)] backdrop-blur-2xl">
          <div className="absolute -left-12 top-12 h-28 w-28 rounded-full bg-[#f6e8ff] blur-3xl" />
          <div className="absolute right-10 top-6 h-16 w-16 rounded-full bg-[#fdf4c7] blur-2xl" />

          <div className="relative space-y-8 px-8 py-10 md:px-12 md:py-12">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold leading-snug md:text-4xl">회원가입</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1F1C2B]" style={{ letterSpacing: "-0.2px" }}>
                  아이디
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    placeholder="아이디를 입력해주세요"
                    {...register("username")}
                    className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] placeholder:text-[#8c869c] shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                    style={{ letterSpacing: "-0.2px" }}
                  />
                  {checkingUsername && (
                    <p className="mt-2 px-1 text-sm text-blue-500">확인 중...</p>
                  )}
                  {errors.username && (
                    <p className="mt-2 px-1 text-sm text-red-500">{errors.username.message}</p>
                  )}
                  {usernameError && !errors.username && (
                    <p className="mt-2 px-1 text-sm text-red-500">{usernameError}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1F1C2B]" style={{ letterSpacing: "-0.2px" }}>
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    placeholder="영문+숫자 조합 10자리 이상 입력해주세요"
                    {...register("password")}
                    className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] placeholder:text-[#8c869c] shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                    style={{ letterSpacing: "-0.2px" }}
                  />
                  {errors.password && (
                    <p className="mt-2 px-1 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1F1C2B]" style={{ letterSpacing: "-0.2px" }}>
                  닉네임
                </label>
                <div className="relative">
                  <input
                    id="nickname"
                    type="text"
                    placeholder="닉네임을 입력해주세요"
                    {...register("nickname")}
                    className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] placeholder:text-[#8c869c] shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                    style={{ letterSpacing: "-0.2px" }}
                  />
                  {checkingNickname && (
                    <p className="mt-2 px-1 text-sm text-blue-500">확인 중...</p>
                  )}
                  {errors.nickname && (
                    <p className="mt-2 px-1 text-sm text-red-500">{errors.nickname.message}</p>
                  )}
                  {nicknameError && !errors.nickname && (
                    <p className="mt-2 px-1 text-sm text-red-500">{nicknameError}</p>
                  )}
                </div>
              </div>

              {validationError && (
                <p className="px-1 text-sm text-red-500" style={{ letterSpacing: "-0.1px" }}>
                  *{validationError}
                </p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || checkingUsername || checkingNickname || !!usernameError || !!nicknameError}
                className="h-[56px] w-full rounded-full bg-[#d4d0df] text-base font-semibold text-[#8c869c] shadow-[0_10px_30px_rgba(118,102,245,0.15)] transition hover:bg-[#cfc5ff] disabled:opacity-60"
              >
                {mutation.isPending ? "가입 중..." : "회원가입"}
              </button>

              <p className="text-center text-sm text-[#625a75]" style={{ letterSpacing: "-0.1px" }}>
                이미 계정이 있으신가요?{" "}
                <Link href="/auth/login" className="font-semibold text-[#7B6CF6] hover:underline">
                  로그인
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

