import { config } from "@/shared/lib/config";
import { apiClient } from "@/shared/lib/api-client";
import type {
  Token,
  User,
  CheckAvailabilityResponse,
  RegisterFormData,
  UserUpdateData,
} from "../model";

/**
 * 인증 관련 API
 */
export const authApi = {
  /**
   * 로그인 (OAuth2 호환)
   * Content-Type: application/x-www-form-urlencoded
   */
  login: async (username: string, password: string): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append("grant_type", "password");
    formData.append("username", username);
    formData.append("password", password);
    formData.append("scope", "");
    formData.append("client_id", "");
    formData.append("client_secret", "");

    const response = await fetch(`${config.apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 400) {
        throw new Error(
          errorData.detail || "이메일 또는 비밀번호가 올바르지 않습니다"
        );
      }

      if (
        response.status === 422 &&
        errorData.detail &&
        Array.isArray(errorData.detail)
      ) {
        const validationErrors = errorData.detail
          .map((err: { msg: string }) => err.msg)
          .join(", ");
        throw new Error(validationErrors || "입력 정보를 확인해주세요");
      }

      throw new Error(errorData.detail || "로그인에 실패했습니다");
    }

    return response.json();
  },

  /**
   * 회원가입
   */
  register: async (data: RegisterFormData): Promise<User> => {
    return apiClient.post<User>("/auth/signup", {
      login_id: data.login_id,
      nickname: data.nickname,
      password: data.password,
      is_active: true,
    });
  },

  /**
   * 로그인 ID 중복 확인
   */
  checkLoginId: async (login_id: string): Promise<CheckAvailabilityResponse> => {
    return apiClient.post<CheckAvailabilityResponse>("/auth/check-login-id", {
      login_id,
    });
  },

  /**
   * 닉네임 중복 확인
   */
  checkNickname: async (
    nickname: string
  ): Promise<CheckAvailabilityResponse> => {
    return apiClient.post<CheckAvailabilityResponse>("/auth/check-nickname", {
      nickname,
    });
  },

  /**
   * 현재 사용자 정보 조회
   */
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>("/users/me");
  },

  /**
   * 내 정보 수정
   */
  updateCurrentUser: async (data: UserUpdateData): Promise<User> => {
    return apiClient.put<User>("/users/me", data);
  },

  /**
   * 회원 탈퇴 (Soft Delete)
   */
  deleteCurrentUser: async (): Promise<User> => {
    return apiClient.delete<User>("/users/me");
  },
};
