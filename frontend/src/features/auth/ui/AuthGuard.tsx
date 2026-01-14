"use client";

import { useEffect, useRef, type FC, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "../model";
import { useAuth } from "../hook";

interface AuthGuardProps {
  children: ReactNode;
  /** 인증되지 않은 경우 리다이렉트할 경로 */
  redirectTo?: string;
  /** 로딩 중 표시할 컴포넌트 */
  fallback?: ReactNode;
}

/**
 * 인증된 사용자만 접근 가능한 라우트를 보호하는 컴포넌트
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
  const hasToken = tokenStorage.exists();
  const { isAuthenticated, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  // 토큰이 없으면 즉시 리다이렉트
  useEffect(() => {
    if (!hasToken && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [hasToken, redirectTo, router]);

  // 토큰은 있지만 인증 실패한 경우 리다이렉트
  useEffect(() => {
    if (hasToken && !isLoading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [hasToken, isAuthenticated, isLoading, redirectTo, router]);

  // 토큰이 없으면 빈 화면 (리다이렉트 대기)
  if (!hasToken) {
    return null;
  }

  // 로딩 중
  if (isLoading) {
    return fallback ?? <AuthGuardLoadingFallback />;
  }

  // 인증되지 않음 (리다이렉트 실행 또는 예정)
  if (!isAuthenticated) {
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
