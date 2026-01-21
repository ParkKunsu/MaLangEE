"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { tokenStorage, userStorage } from "../model";
import { authApi } from "../api/auth-api";

/**
 * localStorage 변경을 구독하기 위한 헬퍼
 */
function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStorageSnapshot() {
  return JSON.stringify({
    hasToken: tokenStorage.exists(),
    user: userStorage.get(),
  });
}

function getServerSnapshot() {
  return JSON.stringify({ hasToken: false, user: null });
}

/**
 * 인증 상태 및 액션을 제공하는 통합 훅
 * localStorage 기반으로 동기적으로 인증 상태를 확인합니다.
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // useSyncExternalStore를 사용하여 localStorage 변경 감지
  const storageState = useSyncExternalStore(
    subscribeToStorage,
    getStorageSnapshot,
    getServerSnapshot
  );

  const { hasToken, user } = JSON.parse(storageState);

  // 인증 상태: 토큰과 사용자 정보가 모두 있는 경우
  const isAuthenticated = hasToken && !!user;

  const logout = useCallback(() => {
    // 모든 스토리지 데이터 제거
    tokenStorage.remove();
    userStorage.remove();
    localStorage.clear();
    sessionStorage.clear();

    // React Query 캐시 초기화
    queryClient.clear();

    router.push("/auth/login");
  }, [queryClient, router]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.getCurrentUser();
      userStorage.set(freshUser);
      return { data: freshUser };
    } catch (error) {
      // 인증 실패 시 로그아웃 처리
      tokenStorage.remove();
      userStorage.remove();
      throw error;
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: false, // localStorage 기반이므로 로딩 없음
    isError: false,
    logout,
    refreshUser,
  };
}
