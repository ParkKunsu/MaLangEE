"use client";

import { useState, useCallback } from "react";
import type { ThinkAloudState, ThinkAloudPrompt, ThinkAloudThinkingStep } from "../model/types";

const SAMPLE_PROMPTS: ThinkAloudPrompt[] = [
  {
    id: "1",
    situation: "직장 동료와의 의견 충돌",
    problem: "프로젝트 방향에 대해 동료와 의견이 다릅니다. 어떻게 설득할 수 있을까요?",
    category: "Communication",
  },
  {
    id: "2",
    situation: "해외 출장 준비",
    problem: "처음 가는 나라에서 비즈니스 미팅을 해야 합니다. 무엇을 준비해야 할까요?",
    category: "Business",
  },
  {
    id: "3",
    situation: "면접 준비",
    problem: "외국계 회사 면접에서 자신의 강점을 어필하는 방법은?",
    category: "Career",
  },
];

/**
 * Think Aloud 학습 모드 상태 관리 훅
 */
export function useThinkAloud() {
  const [state, setState] = useState<ThinkAloudState>({
    currentSession: null,
    isRecording: false,
    currentStep: 0,
    isLoading: false,
    error: null,
  });

  const startSession = useCallback((promptId: string) => {
    const prompt = SAMPLE_PROMPTS.find((p) => p.id === promptId);
    if (!prompt) return;

    setState((prev) => ({
      ...prev,
      currentSession: {
        id: `session-${Date.now()}`,
        promptId,
        prompt,
        thinkingSteps: [],
        startedAt: new Date(),
      },
      currentStep: 1,
      error: null,
    }));
  }, []);

  const addThinkingStep = useCallback((content: string) => {
    setState((prev) => {
      if (!prev.currentSession) return prev;

      const newStep: ThinkAloudThinkingStep = {
        id: `step-${Date.now()}`,
        step: prev.currentStep,
        content,
        timestamp: new Date(),
      };

      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          thinkingSteps: [...prev.currentSession.thinkingSteps, newStep],
        },
        currentStep: prev.currentStep + 1,
      };
    });
  }, []);

  const toggleRecording = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRecording: !prev.isRecording,
    }));
  }, []);

  const submitSolution = useCallback((solution: string) => {
    setState((prev) => {
      if (!prev.currentSession) return prev;

      // TODO: API 호출하여 피드백 받기
      const mockFeedback = "훌륭한 사고 과정입니다! 단계적으로 문제를 분석하고 해결책을 찾았습니다.";
      const mockScore = 85;

      return {
        ...prev,
        currentSession: {
          ...prev.currentSession,
          solution,
          feedback: mockFeedback,
          score: mockScore,
          completedAt: new Date(),
        },
      };
    });
  }, []);

  const resetSession = useCallback(() => {
    setState({
      currentSession: null,
      isRecording: false,
      currentStep: 0,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    state,
    prompts: SAMPLE_PROMPTS,
    startSession,
    addThinkingStep,
    toggleRecording,
    submitSolution,
    resetSession,
  };
}
