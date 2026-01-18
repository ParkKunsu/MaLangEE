import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./auth-api";
import { tokenStorage } from "../model";
import type { LoginFormData, RegisterFormData, NicknameUpdateFormData } from "../model";
import { useSyncGuestSession } from "@/features/chat/api/use-chat-sessions";

const AUTH_QUERY_KEY = ["auth", "user"];

/**
 * 로그인 mutation
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const syncGuestSession = useSyncGuestSession();

  return useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data.username, data.password),
    onSuccess: (data) => {
      console.log("[useLogin] 로그인 성공, 토큰 저장");
      tokenStorage.set(data.access_token);
      
      // 게스트 세션 동기화 로직 추가
      if (typeof window !== "undefined") {
        const sessionId = localStorage.getItem("chatSessionId");
        const entryType = localStorage.getItem("entryType");
        
        if (sessionId && entryType === "guest") {
          console.log("[useLogin] 게스트 세션 발견, 동기화 시도:", sessionId);
          syncGuestSession.mutate(sessionId, {
            onSuccess: () => {
              console.log("[useLogin] 세션 동기화 성공");
              localStorage.setItem("entryType", "member"); // 타입 업데이트
            },
            onError: (err) => {
              console.error("[useLogin] 세션 동기화 실패:", err);
            }
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      console.log("[useLogin] /dashboard로 이동");
      router.push("/dashboard");
    },
  });
}

/**
 * 회원가입 mutation
 */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register(data),
    onSuccess: () => {
      router.push("/auth/login");
    },
  });
}

/**
 * 로그아웃
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      tokenStorage.remove();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/auth/login");
    },
  });
}

/**
 * 회원 탈퇴 mutation
 */
export function useDeleteAccount() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.deleteCurrentUser(),
    onSuccess: () => {
      tokenStorage.remove();
      queryClient.clear();
      router.push("/auth/login");
    },
  });
}

/**
 * 아이디 중복 확인
 */
export function useCheckLoginId() {
  return useMutation({
    mutationFn: (loginId: string) => authApi.checkLoginId(loginId),
  });
}

/**
 * 닉네임 중복 확인
 */
export function useCheckNickname() {
  return useMutation({
    mutationFn: (nickname: string) => authApi.checkNickname(nickname),
  });
}

/**
 * 닉네임 변경 mutation
 */
export function useUpdateNickname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NicknameUpdateFormData) =>
      authApi.updateCurrentUser({ nickname: data.new_nickname }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}
