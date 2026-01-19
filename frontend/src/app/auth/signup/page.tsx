"use client";

import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { MalangEE } from "@/shared/ui";
import { authApi, useLogin, useLoginIdCheck, useNicknameCheck, usePasswordValidation, registerSchema, type RegisterFormData } from "@/features/auth";
import { FullLayout } from "@/shared/ui/FullLayout";
import { Button } from "@/shared/ui";
import { useSyncGuestSession } from "@/features/chat/api/use-chat-sessions";

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

const NETWORK_ERROR_MESSAGE = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
const getCheckErrorMessage = (err?: unknown): string | null => {
  if (!err) return null;
  const message = String(err);
  const networkPatterns = [/failed to fetch/i, /network/i, /ECONNREFUSED/i, /timeout/i, /connect/i, /서버/i];
  return networkPatterns.some((pattern) => pattern.test(message)) ? NETWORK_ERROR_MESSAGE : message;
};

export default function RegisterPage() {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setFocus,
  } = useForm<RegisterFormData>({
    resolver: safeZodResolver,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  // 페이지 로딩 시 이메일 입력창에 포커스
  useEffect(() => {
    setFocus("login_id");
  }, [setFocus]);

  const watchLoginId = watch("login_id");
  const watchNickname = watch("nickname");

  // 중복 확인 훅
  const loginIdCheck = useLoginIdCheck(watchLoginId);
  const nicknameCheck = useNicknameCheck(watchNickname, { minLength: 2 });
  const passwordCheck = usePasswordValidation(watch("password"));

  // 회원가입 mutation
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

  // 세션 동기화 훅
  const syncGuestSession = useSyncGuestSession();

  // 로그인 뮤테이션
  const loginMutation = useLogin();
  const [loginError, setLoginError] = useState<string | null>(null);
  const registerPending = registerMutation.status === "pending";

  const onSubmit = (data: RegisterFormData) => {
    setValidationError(null);
    setLoginError(null);

    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setValidationError(firstIssue.message || "입력 정보를 확인해주세요");
      return;
    }

    if (loginIdCheck.error || nicknameCheck.error || passwordCheck.error) return;
    if (!loginIdCheck.isAvailable || !nicknameCheck.isAvailable) return;

    registerMutation.mutate(data, {
      onSuccess: () => {
        setShowSuccess(true);
      },
    });
  };

  const handleLoginClick = () => {
    setLoginError(null);
    // 로그인 페이지로 이동 (로그인 성공 후의 처리는 로그인 페이지나 전역 가드에서 수행됨)
    // 하지만 가입 직후 세션 동기화가 필요하므로, 로그인 성공 시점에 세션 ID가 있다면 동기화하도록 설계하는 것이 좋음.
    // 여기서는 단순히 로그인 페이지로 보냅니다.
    window.location.href = "/auth/login";
  };

  const isSubmitDisabled =
    registerPending ||
    loginIdCheck.isChecking ||
    nicknameCheck.isChecking ||
    !!loginIdCheck.error ||
    !!nicknameCheck.error ||
    !loginIdCheck.isAvailable ||
    !nicknameCheck.isAvailable;

  useEffect(() => {
    if (passwordCheck.error) {
      setValidationError(passwordCheck.error);
    } else if (validationError && validationError.includes("비밀번호")) {
      setValidationError(null);
    }
  }, [passwordCheck.error, validationError]);

  const rightContent = (
    <div className="mx-auto w-full space-y-7 px-6 md:space-y-9 md:px-0">
      <div className="space-y-2">
        <h1 className="text-text-primary text-3xl font-semibold leading-snug md:text-4xl mb-15">회원가입</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* 이메일 입력 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="login_id" className="text-text-primary px-1 text-sm font-medium">이메일</label>
            <div className="relative">
              <input
                id="login_id"
                type="text"
                placeholder="이메일을 입력해주세요"
                {...register("login_id", {
                  onBlur: () => loginIdCheck.trigger(),
                  onChange: (e) => { e.target.value = e.target.value.toLowerCase(); }
                })}
                className="border-border text-text-primary placeholder:text-muted-foreground focus:border-brand focus:ring-brand-200 h-14 w-full rounded-full border bg-background px-5 text-base focus:outline-none focus:ring-2 lowercase"
              />
              <div className="mt-2 min-h-5">
                {errors.login_id ? (
                  <p className="px-1 text-sm text-red-500">{errors.login_id.message}</p>
                ) : loginIdCheck.error ? (
                  <p className="px-1 text-sm text-red-500">{getCheckErrorMessage(loginIdCheck.error)}</p>
                ) : !loginIdCheck.isChecking && loginIdCheck.isAvailable && watchLoginId ? (
                  <p className="px-1 text-sm text-green-600">사용 가능한 이메일입니다</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-text-primary px-1 text-sm font-medium">비밀번호</label>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="비밀번호 (영문+숫자 10자리 이상)"
                {...register("password")}
                className="border-border text-text-primary placeholder:text-muted-foreground focus:border-brand focus:ring-brand-200 h-14 w-full rounded-full border bg-background px-5 text-base focus:outline-none focus:ring-2"
              />
              <div className="mt-2 min-h-5">
                {errors.password ? (
                  <p className="px-1 text-sm text-red-500">{errors.password.message}</p>
                ) : passwordCheck.error ? (
                  <p className="px-1 text-sm text-red-500">{passwordCheck.error}</p>
                ) : !passwordCheck.isChecking && passwordCheck.isValid && watch("password") ? (
                  <p className="px-1 text-sm text-green-600">사용 가능한 비밀번호입니다</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="nickname" className="text-text-primary px-1 text-sm font-medium">닉네임</label>
            <div className="relative">
              <input
                id="nickname"
                type="text"
                placeholder="닉네임"
                {...register("nickname", { onBlur: () => nicknameCheck.trigger() })}
                maxLength={6}
                className="border-border text-text-primary placeholder:text-muted-foreground focus:border-brand focus:ring-brand-200 h-14 w-full rounded-full border bg-background px-5 text-base focus:outline-none focus:ring-2"
              />
              <div className="mt-2 min-h-5">
                {errors.nickname ? (
                  <p className="px-1 text-sm text-red-500">{errors.nickname.message}</p>
                ) : nicknameCheck.error ? (
                  <p className="px-1 text-sm text-red-500">{getCheckErrorMessage(nicknameCheck.error)}</p>
                ) : !nicknameCheck.isChecking && nicknameCheck.isAvailable && watchNickname ? (
                  <p className="px-1 text-sm text-green-600">사용 가능한 닉네임입니다</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-5">
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitDisabled} isLoading={registerPending}>
            {registerPending ? "가입 중..." : "회원가입"}
          </Button>
          <p className="text-center text-sm text-text-secondary">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="font-semibold text-brand hover:underline">로그인</Link>
          </p>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <FullLayout showHeader={false} maxWidth="md:max-w-[500px]">
        {rightContent}
      </FullLayout>

      {showSuccess && (
        <PopupLayout onClose={() => {}} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE size={120} />
            <div className="text-xl font-bold text-primary">회원이 된걸 축하해요!</div>
            <Button variant="primary" size="md" fullWidth onClick={handleLoginClick}>
              로그인하기
            </Button>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
