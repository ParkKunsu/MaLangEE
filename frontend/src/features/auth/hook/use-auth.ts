"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { tokenStorage } from "../model";
import { useCurrentUser } from "../api";

/**
 * 인증 상태 및 액션을 제공하는 통합 훅
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();

  // 토큰이 없으면 즉시 인증 안됨
  const hasToken = tokenStorage.exists();

  // 401/403 에러인 경우 인증 실패
  const status = (error as { status?: number })?.status;
  const isAuthError = isError && (status === 401 || status === 403);

  // 인증 상태: 토큰이 있고, 사용자 정보가 있으며, 인증 에러가 없는 경우
  const isAuthenticated = hasToken && !!user && !isAuthError;

  const logout = useCallback(() => {
    tokenStorage.remove();
    queryClient.clear();
    router.push("/auth/login");
  }, [queryClient, router]);

  const refreshUser = useCallback(() => {
    return refetch();
  }, [refetch]);

  return {
    user,
    isAuthenticated,
    isLoading: hasToken && isLoading, // 토큰이 없으면 로딩 아님
    isError: isAuthError,
    logout,
    refreshUser,
  };
}
