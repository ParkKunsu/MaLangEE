import { z } from "zod";

// ============================================
// Request Schemas
// ============================================

export const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const registerSchema = z.object({
  login_id: z.string().min(1, "아이디를 입력해주세요"),
  password: z
    .string()
    .min(10, "영문+숫자 조합 10자리 이상 입력해주세요")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, "영문과 숫자를 포함해야 합니다"),
  nickname: z
    .string()
    .min(2, "닉네임은 2~6자 사이로 입력해주세요")
    .max(6, "닉네임은 2~6자 사이로 입력해주세요"),
});

export const loginIdCheckSchema = z.object({
  login_id: z.string().min(1),
});

export const nicknameCheckSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2~6자 사이로 입력해주세요")
    .max(6, "닉네임은 2~6자 사이로 입력해주세요"),
});

export const userUpdateSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2~6자 사이로 입력해주세요")
    .max(6, "닉네임은 2~6자 사이로 입력해주세요")
    .optional(),
  password: z.string().optional(),
});

export const nicknameUpdateSchema = z.object({
  current_nickname: z.string().min(1, "기존 닉네임을 입력해주세요"),
  new_nickname: z
    .string()
    .min(2, "닉네임은 2~6자 사이로 입력해주세요")
    .max(6, "닉네임은 2~6자 사이로 입력해주세요"),
});

// ============================================
// Response Schemas
// ============================================

export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export const userSchema = z.object({
  id: z.number(),
  login_id: z.string(),
  nickname: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const checkAvailabilitySchema = z.object({
  is_available: z.boolean(),
});

// ============================================
// Type Exports
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginIdCheckData = z.infer<typeof loginIdCheckSchema>;
export type NicknameCheckData = z.infer<typeof nicknameCheckSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type NicknameUpdateFormData = z.infer<typeof nicknameUpdateSchema>;

export type Token = z.infer<typeof tokenSchema>;
export type User = z.infer<typeof userSchema>;
export type CheckAvailabilityResponse = z.infer<typeof checkAvailabilitySchema>;
