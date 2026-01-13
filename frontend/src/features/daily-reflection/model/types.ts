/**
 * Daily Reflection 모드 타입 정의
 * 하루를 돌아보며 영어로 성찰하는 학습 방식
 */

export interface ReflectionPrompt {
  id: string;
  question: string;
  category: "achievement" | "challenge" | "learning" | "gratitude" | "goal";
  icon: string;
}

export interface ReflectionEntry {
  id: string;
  promptId: string;
  prompt: ReflectionPrompt;
  answer: string;
  audioUrl?: string;
  feedback?: string;
  grammarSuggestions?: string[];
  vocabularySuggestions?: string[];
  createdAt: Date;
}

export interface DailyReflectionSession {
  id: string;
  date: string;
  entries: ReflectionEntry[];
  completedPrompts: number;
  totalPrompts: number;
  overallFeedback?: string;
  createdAt: Date;
}

export interface DailyReflectionState {
  currentSession: DailyReflectionSession | null;
  isRecording: boolean;
  currentPromptIndex: number;
  isLoading: boolean;
  error: string | null;
}
