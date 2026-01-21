"use client";

import { useEffect, useRef, useState, type FC, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage, userStorage } from "../model";

interface AuthGuardProps {
  children: ReactNode;
  /** 인증되지 않은 경우 리다이렉트할 경로 */
  redirectTo?: string;
  /** 로딩 중 표시할 컴포넌트 */
  fallback?: ReactNode;
}

/**
 * 인증된 사용자만 접근 가능한 라우트를 보호하는 컴포넌트
 * localStorage 기반으로 동기적으로 인증 상태를 확인합니다.
 *
 * @example
 * ```tsx
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export const AuthGuard: FC<AuthGuardProps> = ({
  children,
  redirectTo = "/auth/login",
  fallback,
}) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const hasRedirected = useRef(false);

  // 클라이언트에서만 인증 상태 확인
  useEffect(() => {
    const hasToken = tokenStorage.exists();
    const hasUser = userStorage.exists();
    const isAuthenticated = hasToken && hasUser;

    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthState("authenticated");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthState("unauthenticated");
    }
  }, []);

  // 인증되지 않으면 리다이렉트
  useEffect(() => {
    if (authState === "unauthenticated" && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [authState, redirectTo, router]);

  // 로딩 중
  if (authState === "loading") {
    return fallback ?? <AuthGuardLoadingFallback />;
  }

  // 인증되지 않음 (리다이렉트 대기)
  if (authState === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
};

/**
 * 기본 로딩 폴백 컴포넌트
 */
function AuthGuardLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-700 border-t-transparent" />
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    </div>
  );
}
