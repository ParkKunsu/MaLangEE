/**
 * Rephrasing 모드 타입 정의
 * 주어진 문장을 다양한 방식으로 바꿔 표현하는 학습 방식
 */

export interface RephrasingExercise {
  id: string;
  originalSentence: string;
  context: string;
  targetStyle: "formal" | "casual" | "polite" | "direct";
  difficulty: "easy" | "medium" | "hard";
}

export interface RephrasingAttempt {
  id: string;
  exerciseId: string;
  userAnswer: string;
  suggestions: string[];
  score: number;
  feedback: string;
  createdAt: Date;
}

export interface RephrasingSession {
  id: string;
  exercises: RephrasingExercise[];
  attempts: RephrasingAttempt[];
  currentExerciseIndex: number;
  totalScore: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface RephrasingState {
  currentSession: RephrasingSession | null;
  isLoading: boolean;
  error: string | null;
}
