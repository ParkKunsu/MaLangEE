import { useState, useEffect, useRef, useCallback } from "react";

interface UseInactivityTimerOptions {
  inactivityTime?: number; // 비활동 감지 시간 (기본 15초)
  waitTime?: number;       // 응답 대기 시간 (기본 5초)
}

export function useInactivityTimer({
  inactivityTime = 15000,
  waitTime = 5000,
}: UseInactivityTimerOptions = {}) {
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [showWaitPopup, setShowWaitPopup] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    setShowInactivityMessage(false);
    setShowWaitPopup(false);
  }, [clearTimers]);

  const startWaitTimer = useCallback(() => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    
    waitTimerRef.current = setTimeout(() => {
      setShowWaitPopup(true);
    }, waitTime);
  }, [waitTime]);

  const startInactivityTimer = useCallback(() => {
    clearTimers();
    
    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityMessage(true);
      startWaitTimer();
    }, inactivityTime);
  }, [inactivityTime, clearTimers, startWaitTimer]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return {
    showInactivityMessage,
    showWaitPopup,
    startInactivityTimer,
    resetTimers,
    clearTimers,
    setShowWaitPopup, // 팝업 닫기 등을 위해 노출
  };
}
