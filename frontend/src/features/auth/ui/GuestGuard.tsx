"use client";

import { useEffect, useRef, type FC, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "../model";
import { useAuth } from "../hook";

interface GuestGuardProps {
  children: ReactNode;
  /** 이미 인증된 경우 리다이렉트할 경로 */
  redirectTo?: string;
}

/**
 * 비인증 사용자(게스트)만 접근 가능한 라우트를 보호하는 컴포넌트
 * 로그인 페이지, 회원가입 페이지 등에 사용
 *
 * @example
 * ```tsx
 * <GuestGuard>
 *   <LoginPage />
 * </GuestGuard>
 * ```
 */
export const GuestGuard: FC<GuestGuardProps> = ({
  children,
  redirectTo = "/chat-history",
}) => {
  const router = useRouter();
  const hasToken = tokenStorage.exists();
  const { isAuthenticated, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  // 인증된 사용자는 리다이렉트
  useEffect(() => {
    if (hasToken && !isLoading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo);
    }
  }, [hasToken, isAuthenticated, isLoading, redirectTo, router]);

  // 토큰이 없으면 즉시 children 렌더링 (로그인 페이지 등)
  if (!hasToken) {
    return <>{children}</>;
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5F51D9] border-t-transparent" />
      </div>
    );
  }

  // 인증된 상태 (리다이렉트 실행 또는 예정)
  if (isAuthenticated) {
    return null;
  }

  // 토큰은 있지만 인증 실패 (401/403 등) - children 렌더링
  return <>{children}</>;
};
