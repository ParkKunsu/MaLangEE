"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/features/auth";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 로그아웃 페이지
 * 이 페이지에 접속하면 자동으로 로그아웃 처리되고 로그인 페이지로 이동합니다.
 */
export default function LogoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 모든 스토리지 데이터 제거
    tokenStorage.remove();
    localStorage.clear();
    sessionStorage.clear();

    // React Query 캐시 초기화
    queryClient.clear();

    // 로그인 페이지로 리다이렉트
    router.replace("/auth/login");
  }, [router, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7B6CF6] border-t-transparent" />
        <p className="text-sm text-gray-500">로그아웃 중...</p>
      </div>
    </div>
  );
}
