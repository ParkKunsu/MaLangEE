/**
 * Quick Response 모드 타입 정의
 */

export interface QuickResponseQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuickResponseAnswer {
  questionId: string;
  answer: string;
  responseTime: number; // 밀리초
  timestamp: string;
}

export interface QuickResponseSession {
  id: string;
  startTime: string;
  endTime?: string;
  questions: QuickResponseQuestion[];
  answers: QuickResponseAnswer[];
  score?: number;
}

export interface QuickResponseState {
  currentQuestion: QuickResponseQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  answers: QuickResponseAnswer[];
  isRecording: boolean;
  timer: number;
  sessionId: string | null;
}
