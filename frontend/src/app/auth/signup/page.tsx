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
  } = useForm<RegisterFormData>({
    resolver: safeZodResolver,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const watchLoginId = watch("login_id");
  const watchNickname = watch("nickname");

  // 중복 확인 훅
  const loginIdCheck = useLoginIdCheck(watchLoginId);
  const nicknameCheck = useNicknameCheck(watchNickname, { minLength: 2 });
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
  const [loginError, setLoginError] = useState<string | null>(null);
  const registerPending = registerMutation.status === "pending";

  const onSubmit = (data: RegisterFormData) => {
    setValidationError(null);
    setLoginError(null);

    // 방어적 유효성 검사: ZodError가 프로미스에서 uncaught 되는 것을 막기 위해 safeParse 사용
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setValidationError(firstIssue.message || "입력 정보를 확인해주세요");
      return;
    }

    // 유효성 검사 오류가 있는지 확인 (필드 레벨 에러가 있으면 여기서 멈춤)
    if (loginIdCheck.error || nicknameCheck.error || passwordCheck.error) {
      return;
    }

    // 중복 체크가 완료되지 않았거나 사용 불가능한 경우
    if (!loginIdCheck.isAvailable || !nicknameCheck.isAvailable) {
      return;
    }

    // 성공 시 팝업을 띄우기 위해 mutate 호출
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

  // 비밀번호 실시간 유효성 체크 연동
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
          {/* 아이디 입력 */}
          <div className="relative">
            <input
              id="login_id"
              type="text"
              placeholder="아이디"
              {...register("login_id", {
                onBlur: () => loginIdCheck.trigger(),
              })}
              className="border-border text-text-primary placeholder:text-muted-foreground focus:border-brand focus:ring-brand-200 h-14 w-full rounded-full border bg-background px-5 text-base focus:outline-none focus:ring-2"
              style={{ letterSpacing: "-0.2px" }}
            />
            <div className="mt-0 ">
              {errors.login_id ? (
                <p className="whitespace-nowrap px-1 text-sm text-red-500">{errors.login_id.message}</p>
              ) : loginIdCheck.isChecking ? (
                <p className="whitespace-nowrap px-1 text-sm text-blue-500">확인 중...</p>
              ) : loginIdCheck.error ? (
                <p className="whitespace-nowrap px-1 text-sm text-red-500">
                  {getCheckErrorMessage(loginIdCheck.error)}
                </p>
              ) : !loginIdCheck.isChecking && loginIdCheck.isAvailable && watchLoginId ? (
                <p className="whitespace-nowrap px-1 text-sm text-green-600">사용 가능한 아이디입니다</p>
              ) : null}
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="비밀번호 (영문+숫자 10자리 이상)"
              {...register("password")}
              className="border-border text-text-primary placeholder:text-muted-foreground focus:border-brand focus:ring-brand-200 h-14 w-full rounded-full border bg-background px-5 text-base focus:outline-none focus:ring-2"
              style={{ letterSpacing: "-0.2px" }}
            />
            <div className="mt-0  ">
              {errors.password ? (
                <p className="whitespace-nowrap px-1 text-sm text-red-500">{errors.password.message}</p>
              ) : passwordCheck.isChecking ? (
                <p className="whitespace-nowrap px-1 text-sm text-blue-500">확인 중...</p>
              ) : passwordCheck.error ? (
                <p className="whitespace-nowrap px-1 text-sm text-red-500">{passwordCheck.error}</p>
              ) : !passwordCheck.isChecking && passwordCheck.isValid && watch("password") ? (
                <p className="whitespace-nowrap px-1 text-sm text-green-600">사용 가능한 비밀번호입니다</p>
              ) : validationError && validationError.includes("비밀번호") ? (
                <p className="whitespace-nowrap px-1 text-sm text-red-500">{validationError}</p>
              ) : null}
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div className="relative">
            <input
              id="nickname"
              type="text"
              placeholder="닉네임"
              {...register("nickname", {
                onBlur: () => nicknameCheck.trigger(),
              })}
              maxLength={6}
              className="border-border text-text-primary placeholder:text-muted-foreground focus:border-brand focus:ring-brand-200 h-14 w-full rounded-full border bg-background px-5 text-base focus:outline-none focus:ring-2"
              style={{ letterSpacing: "-0.2px" }}
            />
            <div className="mt-0 ">
              {errors.nickname ? (
                <p className="whitespace-nowrap px-1 text-sm text-red-500">{errors.nickname.message}</p>
              ) : nicknameCheck.isChecking ? (
                <p className="whitespace-nowrap px-1 text-sm text-blue-500">확인 중...</p>
              ) : nicknameCheck.error ? (
                <p className="whitespace-nowrap px-1 text-sm text-red-500">
                  {getCheckErrorMessage(nicknameCheck.error)}
                </p>
              ) : !nicknameCheck.isChecking && nicknameCheck.isAvailable && watchNickname ? (
                <p className="whitespace-nowrap px-1 text-sm text-green-600">사용 가능한 닉네임입니다</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* validationError가 필드 레벨 에러들(ID, 닉네임, 비번)과 중복되지 않을 때만 폼 하단에 표시 */}
        {validationError &&
         !errors.login_id && !loginIdCheck.error &&
         !errors.nickname && !nicknameCheck.error &&
         !errors.password && !passwordCheck.error && (
          <p className="whitespace-nowrap px-1 text-sm text-red-500" style={{ letterSpacing: "-0.1px" }}>
            *{validationError}
          </p>
        )}

        <div className="flex flex-col gap-4 sm:gap-5">
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

          <p className="text-center text-sm text-text-secondary" style={{ letterSpacing: "-0.1px" }}>
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="font-semibold text-brand hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <FullLayout
        showHeader={false}
        maxWidth="md:max-w-3xl"
      >
        {rightContent}
      </FullLayout>

      {/* 회원가입 성공 팝업 */}
      {showSuccess && (
        <PopupLayout onClose={() => {}} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE size={120} />
            <div className="text-xl font-bold text-primary">회원이 된걸 축하해요!</div>
            {loginError && <p className="whitespace-nowrap text-sm text-red-500">{loginError}</p>}
            <Button
              variant="primary"
              size="md"
              fullWidth
              isLoading={loginMutation.isPending}
              onClick={() => {
                setLoginError(null);
                window.location.href = "/auth/login";
              }}
            >
              로그인하기
            </Button>
          </div>
        </PopupLayout>
      )}
    </>
  );
}
