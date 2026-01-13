import { useState, useCallback, useEffect } from "react";
import type { QuickResponseQuestion, QuickResponseAnswer, QuickResponseState } from "../model/types";

/**
 * Quick Response 상태 관리 훅
 */
export function useQuickResponse() {
  const [state, setState] = useState<QuickResponseState>({
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 5,
    answers: [],
    isRecording: false,
    timer: 0,
    sessionId: null,
  });

  const [startTime, setStartTime] = useState<number | null>(null);

  // 타이머 관리
  useEffect(() => {
    if (state.isRecording && startTime) {
      const interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          timer: Date.now() - startTime,
        }));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state.isRecording, startTime]);

  // 세션 시작
  const startSession = useCallback(() => {
    const sessionId = `quick-response-${Date.now()}`;
    const mockQuestions: QuickResponseQuestion[] = [
      {
        id: "1",
        question: "What's your favorite food?",
        category: "Personal",
        difficulty: "easy",
      },
      {
        id: "2",
        question: "How do you spend your free time?",
        category: "Lifestyle",
        difficulty: "easy",
      },
      {
        id: "3",
        question: "What would you do if you won the lottery?",
        category: "Hypothetical",
        difficulty: "medium",
      },
      {
        id: "4",
        question: "Describe your ideal vacation.",
        category: "Travel",
        difficulty: "medium",
      },
      {
        id: "5",
        question: "How has technology changed your life?",
        category: "Opinion",
        difficulty: "hard",
      },
    ];

    setState({
      currentQuestion: mockQuestions[0],
      questionIndex: 0,
      totalQuestions: mockQuestions.length,
      answers: [],
      isRecording: false,
      timer: 0,
      sessionId,
    });
  }, []);

  // 녹음 시작
  const startRecording = useCallback(() => {
    setStartTime(Date.now());
    setState((prev) => ({
      ...prev,
      isRecording: true,
      timer: 0,
    }));
  }, []);

  // 녹음 중지 및 답변 저장
  const stopRecording = useCallback(() => {
    if (!state.currentQuestion || !startTime) return;

    const answer: QuickResponseAnswer = {
      questionId: state.currentQuestion.id,
      answer: "", // 실제로는 음성 인식 결과
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      answers: [...prev.answers, answer],
      isRecording: false,
    }));

    setStartTime(null);
  }, [state.currentQuestion, startTime]);

  // 다음 질문으로 이동
  const nextQuestion = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.questionIndex + 1;
      if (nextIndex >= prev.totalQuestions) {
        // 세션 종료
        return {
          ...prev,
          currentQuestion: null,
          questionIndex: nextIndex,
        };
      }

      // 다음 질문 (실제로는 API에서 가져옴)
      const mockNextQuestion: QuickResponseQuestion = {
        id: `${nextIndex + 1}`,
        question: "Next question placeholder",
        category: "Category",
        difficulty: "medium",
      };

      return {
        ...prev,
        currentQuestion: mockNextQuestion,
        questionIndex: nextIndex,
        timer: 0,
      };
    });
  }, []);

  // 세션 종료
  const endSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestion: null,
      sessionId: null,
    }));
  }, []);

  return {
    state,
    startSession,
    startRecording,
    stopRecording,
    nextQuestion,
    endSession,
  };
}
