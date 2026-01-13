"use client";

import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { MalangEE } from "@/shared/ui";
import { authApi, useLogin, useLoginIdCheck, useNicknameCheck, usePasswordValidation, registerSchema, type RegisterFormData } from "@/features/auth";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button } from "@/shared/ui";

// safeParse를 사용하는 커스텀 resolver (콘솔 에러 방지)
const safeZodResolver: Resolver<RegisterFormData> = async (values) => {
  const result = registerSchema.safeParse(values);
  
  if (result.success) {
    return { values: result.data, errors: {} };
  }
  
  // ZodError를 React Hook Form의 에러 형식으로 변환
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

export default function RegisterPage() {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: safeZodResolver,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const watchLoginId = watch("login_id");
  const watchNickname = watch("nickname");

  // 중복 확인 훅
  const loginIdCheck = useLoginIdCheck(watchLoginId);
  const nicknameCheck = useNicknameCheck(watchNickname);
  const passwordCheck = usePasswordValidation(watch("password"));

  // 회원가입 mutation (로컬에서 처리하여 리다이렉트 제어)
  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register(data),
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

  // 로그인 뮤테이션 (팝업에서 시도)
  const loginMutation = useLogin();
  const [savedCredentials, setSavedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const registerPending = registerMutation.status === "pending";

  const onSubmit = (data: RegisterFormData) => {
  setValidationError(null);
  setLoginError(null);

  // 방어적 유효성 검사: ZodError가 프로미스에서 uncaught 되는 것을 막기 위해 safeParse 사용
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    // 가능한 한 첫 번째 에러 메시지를 보여줍니다
    const firstIssue = parsed.error.issues[0];
    setValidationError(firstIssue.message || "입력 정보를 확인해주세요");
    return;
  }

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

    // 성공 시 팝업을 띄우기 위해 자격증명 저장 후 mutate 호출
    setSavedCredentials({ username: data.login_id, password: data.password });
    registerMutation.mutate(data, {
      onSuccess: () => {
        setShowSuccess(true);
      },
    });
  };

  const isSubmitDisabled =
    registerPending ||
    loginIdCheck.isChecking ||
    nicknameCheck.isChecking ||
    !!loginIdCheck.error ||
    !!nicknameCheck.error ||
    !loginIdCheck.isAvailable ||
    !nicknameCheck.isAvailable;

  // 비밀번호 체크는 usePasswordValidation 훅으로 처리

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
              {passwordCheck.isChecking && (
                <p className="mt-2 px-1 text-sm text-blue-500">확인 중...</p>
              )}
              {errors.password && (
                <p className="mt-2 px-1 text-sm text-red-500">{errors.password.message}</p>
              )}
              {passwordCheck.error && !errors.password && (
                <p className="mt-2 px-1 text-sm text-red-500">{passwordCheck.error}</p>
              )}
              {!passwordCheck.isChecking && !passwordCheck.error && passwordCheck.isValid && watch("password") && (
                <p className="mt-2 px-1 text-sm text-green-600">사용 가능한 비밀번호입니다</p>
              )}
              {/* 서버/submit 관련 validationError가 비밀번호 관련이면 하단에 표시 */}
              {validationError && validationError.includes("비밀번호") && (
                <p className="mt-2 px-1 text-sm text-red-500">{validationError}</p>
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

          {/* validationError가 비밀번호 관련이 아닐 때만 폼 하단에 표시 */}
          {validationError && !validationError.includes("비밀번호") && (
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
            isLoading={registerPending}
          >
            {registerPending ? "가입 중..." : "회원가입"}
          </Button>

          <p className="text-center text-sm text-[#625a75]" style={{ letterSpacing: "-0.1px" }}>
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="font-semibold text-[#7B6CF6] hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>

      {/* 회원가입 성공 팝업 */}
      {showSuccess && (
        <PopupLayout onClose={() => {}} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE size={120} />
            <div className="text-xl font-bold text-[#5F51D9]">회원이 된걸 축하해요!</div>
            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
            <Button
              variant="primary"
              size="md"
              fullWidth
              isLoading={loginMutation.isPending}
              onClick={() => {
                setLoginError(null);
                if (!savedCredentials) {
                  // 자격증명이 없으면 로그인 페이지로 이동
                  window.location.href = "/auth/login";
                  return;
                }

                loginMutation.mutate(
                  {
                    username: savedCredentials.username,
                    password: savedCredentials.password,
                  },
                  {
                    onError: (error) => {
                      if (error instanceof Error) setLoginError(error.message);
                      else setLoginError("로그인에 실패했습니다");
                    },
                  }
                );
              }}
            >
              로그인하기
            </Button>
          </div>
        </PopupLayout>
      )}
    </FullLayout>
  );
}
