/**
 * Think Aloud 모드 타입 정의
 * 생각을 소리내어 말하며 문제를 해결하는 학습 방식
 */

export interface ThinkAloudPrompt {
  id: string;
  situation: string;
  problem: string;
  category: string;
}

export interface ThinkAloudThinkingStep {
  id: string;
  step: number;
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface ThinkAloudSession {
  id: string;
  promptId: string;
  prompt: ThinkAloudPrompt;
  thinkingSteps: ThinkAloudThinkingStep[];
  solution?: string;
  feedback?: string;
  score?: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface ThinkAloudState {
  currentSession: ThinkAloudSession | null;
  isRecording: boolean;
  currentStep: number;
  isLoading: boolean;
  error: string | null;
}
