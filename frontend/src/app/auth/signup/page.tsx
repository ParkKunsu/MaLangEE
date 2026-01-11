"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  useRegister,
  useLoginIdCheck,
  useNicknameCheck,
  registerSchema,
  type RegisterFormData,
} from "@/features/auth";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button } from "@/shared/ui";

export default function RegisterPage() {
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchLoginId = watch("login_id");
  const watchNickname = watch("nickname");

  // 중복 확인 훅
  const loginIdCheck = useLoginIdCheck(watchLoginId);
  const nicknameCheck = useNicknameCheck(watchNickname);

  // 회원가입 mutation
  const registerMutation = useRegister();

  const onSubmit = (data: RegisterFormData) => {
    setValidationError(null);

    // 유효성 검사 오류가 있는지 확인
    if (loginIdCheck.error || nicknameCheck.error) {
      setValidationError("아이디 또는 닉네임을 확인해주세요");
      return;
    }

    // 중복 체크가 완료되지 않았거나 사용 불가능한 경우
    if (!loginIdCheck.isAvailable || !nicknameCheck.isAvailable) {
      setValidationError("아이디 또는 닉네임을 확인해주세요");
      return;
    }

    registerMutation.mutate(data, {
      onError: (error) => {
        if (error instanceof Error) {
          const message = error.message;
          if (message.includes("이미")) {
            setValidationError(message);
          } else {
            setValidationError(
              "회원가입에 실패했습니다. 입력 정보를 확인해주세요."
            );
          }
        }
      },
    });
  };

  const isSubmitDisabled =
    registerMutation.isPending ||
    loginIdCheck.isChecking ||
    nicknameCheck.isChecking ||
    !!loginIdCheck.error ||
    !!nicknameCheck.error ||
    !loginIdCheck.isAvailable ||
    !nicknameCheck.isAvailable;

  return (
    <FullLayout showHeader={false} maxWidth="md:max-w-[450px]">
        <div className="w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-snug md:text-4xl">회원가입</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* 아이디 입력 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#1F1C2B]"
                style={{ letterSpacing: "-0.2px" }}
              >
                아이디
              </label>
              <div className="relative">
                <input
                  id="login_id"
                  type="text"
                  placeholder="아이디를 입력해주세요"
                  {...register("login_id")}
                  className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] shadow-[0_2px_6px_rgba(0,0,0,0.03)] placeholder:text-[#8c869c] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                  style={{ letterSpacing: "-0.2px" }}
                />
                {loginIdCheck.isChecking && (
                  <p className="mt-2 px-1 text-sm text-blue-500">확인 중...</p>
                )}
                {errors.login_id && (
                  <p className="mt-2 px-1 text-sm text-red-500">{errors.login_id.message}</p>
                )}
                {loginIdCheck.error && !errors.login_id && (
                  <p className="mt-2 px-1 text-sm text-red-500">{loginIdCheck.error}</p>
                )}
                {!loginIdCheck.isChecking &&
                  !loginIdCheck.error &&
                  loginIdCheck.isAvailable &&
                  watchLoginId && (
                    <p className="mt-2 px-1 text-sm text-green-600">사용 가능한 아이디입니다</p>
                  )}
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#1F1C2B]"
                style={{ letterSpacing: "-0.2px" }}
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="영문+숫자 조합 10자리 이상 입력해주세요"
                  {...register("password")}
                  className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] shadow-[0_2px_6px_rgba(0,0,0,0.03)] placeholder:text-[#8c869c] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                  style={{ letterSpacing: "-0.2px" }}
                />
                {errors.password && (
                  <p className="mt-2 px-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* 닉네임 입력 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#1F1C2B]"
                style={{ letterSpacing: "-0.2px" }}
              >
                닉네임
              </label>
              <div className="relative">
                <input
                  id="nickname"
                  type="text"
                  placeholder="닉네임을 입력해주세요"
                  {...register("nickname")}
                  className="h-[56px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-base text-[#1F1C2B] shadow-[0_2px_6px_rgba(0,0,0,0.03)] placeholder:text-[#8c869c] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                  style={{ letterSpacing: "-0.2px" }}
                />
                {nicknameCheck.isChecking && (
                  <p className="mt-2 px-1 text-sm text-blue-500">확인 중...</p>
                )}
                {errors.nickname && (
                  <p className="mt-2 px-1 text-sm text-red-500">{errors.nickname.message}</p>
                )}
                {nicknameCheck.error && !errors.nickname && (
                  <p className="mt-2 px-1 text-sm text-red-500">{nicknameCheck.error}</p>
                )}
                {!nicknameCheck.isChecking &&
                  !nicknameCheck.error &&
                  nicknameCheck.isAvailable &&
                  watchNickname && (
                    <p className="mt-2 px-1 text-sm text-green-600">사용 가능한 닉네임입니다</p>
                  )}
              </div>
            </div>

            {validationError && (
              <p className="px-1 text-sm text-red-500" style={{ letterSpacing: "-0.1px" }}>
                *{validationError}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitDisabled}
              isLoading={registerMutation.isPending}
            >
              {registerMutation.isPending ? "가입 중..." : "회원가입"}
            </Button>

            <p className="text-center text-sm text-[#625a75]" style={{ letterSpacing: "-0.1px" }}>
              이미 계정이 있으신가요?{" "}
              <Link href="/auth/login" className="font-semibold text-[#7B6CF6] hover:underline">
                로그인
              </Link>
            </p>
          </form>
        </div>
      </FullLayout>
  );
}
