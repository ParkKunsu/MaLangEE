"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  /** 즉시 확인 실행 */
  trigger: () => void;
}

/**
 * 로그인 ID 중복 확인 훅
 */
export function useLoginIdCheck(
  value: string,
  options: UseDuplicateCheckOptions = {}
): UseDuplicateCheckResult {
  const { debounceMs = 1000, minLength = 4 } = options;

  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const runCheck = useCallback(
    async (val: string, signal: AbortSignal) => {
      if (!val || val.length < minLength) {
        setError(null);
        setIsAvailable(null);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      try {
        const result = await authApi.checkLoginId(val);
        if (signal.aborted) return;

        setIsAvailable(result.is_available);
        setError(result.is_available ? null : "이미 사용중인 아이디입니다");
      } catch (error) {
        if (signal.aborted) return;

        console.error("아이디 중복 확인 오류:", error);

        let errorMessage = "아이디 확인 중 오류가 발생했습니다";
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
          } else {
            errorMessage = error.message || errorMessage;
          }
        }

        setError(errorMessage);
        setIsAvailable(null);
      } finally {
        if (!signal.aborted) {
          setIsChecking(false);
        }
      }
    },
    [minLength]
  );

  const trigger = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    runCheck(value, abortController.signal);
  };

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

    timerRef.current = setTimeout(() => {
      runCheck(value, abortController.signal);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortController.abort();
    };
  }, [value, debounceMs, minLength, runCheck]);

  return { error, isChecking, isAvailable, trigger };
}

/**
 * 닉네임 중복 확인 훅
 */
export function useNicknameCheck(
  value: string,
  options: UseDuplicateCheckOptions = {}
): UseDuplicateCheckResult {
  const { debounceMs = 1000, minLength = 2 } = options;

  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const runCheck = useCallback(
    async (val: string, signal: AbortSignal) => {
      if (!val || val.length < minLength) {
        setError(null);
        setIsAvailable(null);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      try {
        const result = await authApi.checkNickname(val);
        if (signal.aborted) return;

        setIsAvailable(result.is_available);
        setError(result.is_available ? null : "이미 사용중인 닉네임입니다");
      } catch (error) {
        if (signal.aborted) return;

        console.error("닉네임 중복 확인 오류:", error);
        let errorMessage = "닉네임 확인 중 오류가 발생했습니다";
        if (error instanceof Error) {
          if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
          } else {
            errorMessage = error.message || errorMessage;
          }
        }
        setError(errorMessage);
        setIsAvailable(null);
      } finally {
        if (!signal.aborted) {
          setIsChecking(false);
        }
      }
    },
    [minLength]
  );

  const trigger = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    runCheck(value, abortController.signal);
  };

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

    timerRef.current = setTimeout(() => {
      runCheck(value, abortController.signal);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortController.abort();
    };
  }, [value, debounceMs, minLength, runCheck]);

  return { error, isChecking, isAvailable, trigger };
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

