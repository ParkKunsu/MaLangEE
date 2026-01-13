"use client";

import { useState, useEffect, useRef } from "react";
import { authApi } from "../api";
import { registerSchema } from "../model/schema";

interface UseDuplicateCheckOptions {
  /** 디바운스 지연 시간 (ms) */
  debounceMs?: number;
  /** 최소 입력 길이 */
  minLength?: number;
}

interface UseDuplicateCheckResult {
  /** 에러 메시지 (null이면 에러 없음) */
  error: string | null;
  /** 확인 중 여부 */
  isChecking: boolean;
  /** 사용 가능 여부 (null이면 아직 확인 안됨) */
  isAvailable: boolean | null;
}

/**
 * 로그인 ID 중복 확인 훅
 */
export function useLoginIdCheck(
  value: string,
  options: UseDuplicateCheckOptions = {}
): UseDuplicateCheckResult {
  const { debounceMs = 500, minLength = 1 } = options;

  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 값이 없거나 최소 길이 미달이면 초기화
    if (!value || value.length < minLength) {
      setError(null);
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timer = setTimeout(async () => {
      if (abortController.signal.aborted) return;

      setIsChecking(true);
      try {
        const result = await authApi.checkLoginId(value);
        if (abortController.signal.aborted) return;

        setIsAvailable(result.is_available);
        setError(result.is_available ? null : "이미 사용중인 아이디입니다");
      } catch (error) {
        if (abortController.signal.aborted) return;
        
        // 에러 상세 정보 로깅 (개발 환경에서 디버깅용)
        console.error("아이디 중복 확인 오류:", error);
        
        // 에러 타입에 따라 다른 메시지 표시
        let errorMessage = "아이디 확인 중 오류가 발생했습니다";
        if (error instanceof Error) {
          // 네트워크 에러인 경우
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
          } else if (error.message.includes("401")) {
            errorMessage = "인증이 필요합니다.";
          } else if (error.message.includes("404")) {
            errorMessage = "API 엔드포인트를 찾을 수 없습니다.";
          } else if (error.message.includes("500")) {
            errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          } else {
            // 기타 에러는 원본 메시지 사용
            errorMessage = error.message || errorMessage;
          }
        }
        
        setError(errorMessage);
        setIsAvailable(null);
      } finally {
        if (!abortController.signal.aborted) {
          setIsChecking(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [value, debounceMs, minLength]);

  return { error, isChecking, isAvailable };
}

/**
 * 닉네임 중복 확인 훅
 */
export function useNicknameCheck(
  value: string,
  options: UseDuplicateCheckOptions = {}
): UseDuplicateCheckResult {
  const { debounceMs = 500, minLength = 1 } = options;

  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!value || value.length < minLength) {
      setError(null);
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timer = setTimeout(async () => {
      if (abortController.signal.aborted) return;

      setIsChecking(true);
      try {
        const result = await authApi.checkNickname(value);
        if (abortController.signal.aborted) return;

        setIsAvailable(result.is_available);
        setError(result.is_available ? null : "이미 사용중인 닉네임입니다");
      } catch (error) {
        if (abortController.signal.aborted) return;
        
        // 에러 상세 정보 로깅 (개발 환경에서 디버깅용)
        console.error("닉네임 중복 확인 오류:", error);
        
        // 에러 타입에 따라 다른 메시지 표시
        let errorMessage = "닉네임 확인 중 오류가 발생했습니다";
        if (error instanceof Error) {
          // 네트워크 에러인 경우
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
          } else if (error.message.includes("401")) {
            errorMessage = "인증이 필요합니다.";
          } else if (error.message.includes("404")) {
            errorMessage = "API 엔드포인트를 찾을 수 없습니다.";
          } else if (error.message.includes("500")) {
            errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          } else {
            // 기타 에러는 원본 메시지 사용
            errorMessage = error.message || errorMessage;
          }
        }
        
        setError(errorMessage);
        setIsAvailable(null);
      } finally {
        if (!abortController.signal.aborted) {
          setIsChecking(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [value, debounceMs, minLength]);

  return { error, isChecking, isAvailable };
}

/**
 * 비밀번호 유효성 검사용 훅
 * - registerSchema의 password 규칙을 사용합니다
 */
export function usePasswordValidation(
  value: string,
  options: UseDuplicateCheckOptions = {}
): { error: string | null; isChecking: boolean; isValid: boolean | null } {
  const { debounceMs = 300, minLength = 1 } = options;

  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // 단순 초기화
    if (!value || value.length < minLength) {
      setError(null);
      setIsValid(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(() => {
      try {
        // registerSchema의 password 규칙만 사용
        const pwdSchema = registerSchema.pick({ password: true });
        const parsed = pwdSchema.safeParse({ password: value });
        if (!mountedRef.current) return;

        if (!parsed.success) {
          const msg = parsed.error.issues[0]?.message || "비밀번호 형식이 올바르지 않습니다";
          setError(String(msg));
          setIsValid(false);
        } else {
          setError(null);
          setIsValid(true);
        }
      } catch (e) {
        console.error("비밀번호 검증 오류:", e);
        setError("비밀번호 검증 중 오류가 발생했습니다");
        setIsValid(null);
      } finally {
        if (mountedRef.current) setIsChecking(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, debounceMs, minLength]);

  return { error, isChecking, isValid };
}
