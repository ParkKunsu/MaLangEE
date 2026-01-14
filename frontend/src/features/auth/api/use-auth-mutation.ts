import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./auth-api";
import { tokenStorage } from "../model";
import type { LoginFormData, RegisterFormData, NicknameUpdateFormData } from "../model";

const AUTH_QUERY_KEY = ["auth", "user"];

/**
 * 로그인 mutation
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginFormData) =>
      authApi.login(data.username, data.password),
    onSuccess: (data) => {
      console.log("[useLogin] 로그인 성공, 토큰 저장");
      tokenStorage.set(data.access_token);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      console.log("[useLogin] /chat-history로 이동");
      router.push("/chat-history");
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
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NicknameUpdateFormData) =>
      authApi.updateCurrentUser({ nickname: data.new_nickname }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      router.push("/topic-select");
    },
  });
}

