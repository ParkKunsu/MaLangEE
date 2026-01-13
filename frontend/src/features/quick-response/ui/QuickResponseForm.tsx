import { FC } from "react";
import { Mic, MicOff, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui";
import type { QuickResponseState } from "../model/types";

export interface QuickResponseFormProps {
  state: QuickResponseState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onNext: () => void;
}

export const QuickResponseForm: FC<QuickResponseFormProps> = ({
  state,
  onStartRecording,
  onStopRecording,
  onNext,
}) => {
  const formatTimer = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);
    return `${seconds}.${milliseconds}s`;
  };

  return (
    <div className="relative w-full max-w-[640px] overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-50/80 shadow-[0_20px_80px_rgba(125,106,246,0.25)] backdrop-blur-2xl">
      {/* 카드 내부 장식 */}
      <div className="absolute -left-12 top-12 h-28 w-28 rounded-full bg-[#f6e8ff] blur-3xl" />
      <div className="absolute right-10 top-6 h-16 w-16 rounded-full bg-[#fdf4c7] blur-2xl" />

      <div className="relative flex flex-col items-center gap-8 px-8 py-12 md:px-16 md:py-16">
        {/* 진행 상황 */}
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between text-sm text-text-secondary">
            <span>질문 {state.questionIndex + 1} / {state.totalQuestions}</span>
            {state.isRecording && (
              <span className="animate-pulse font-medium text-red-500">
                녹음 중... {formatTimer(state.timer)}
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{
                width: `${((state.questionIndex + 1) / state.totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 질문 카드 */}
        {state.currentQuestion && (
          <div className="w-full space-y-6 text-center">
            <div className="inline-block rounded-full bg-orange-500/10 px-4 py-1">
              <span className="text-sm font-medium text-orange-500">
                {state.currentQuestion.category}
              </span>
            </div>

            <h2
              className="text-2xl font-bold leading-snug text-text-primary md:text-3xl"
              style={{ letterSpacing: "-0.5px" }}
            >
              {state.currentQuestion.question}
            </h2>

            <div className="flex items-center justify-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  state.currentQuestion.difficulty === "easy"
                    ? "bg-green-500"
                    : state.currentQuestion.difficulty === "medium"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <span className="text-sm capitalize text-text-secondary">
                {state.currentQuestion.difficulty}
              </span>
            </div>
          </div>
        )}

        {/* 마이크 버튼 */}
        {state.currentQuestion && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={state.isRecording ? onStopRecording : onStartRecording}
              className={`
                group relative flex h-24 w-24 items-center justify-center rounded-full
                shadow-[0_10px_40px_rgba(118,102,245,0.4)]
                transition-all duration-300
                ${
                  state.isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-orange-500 hover:bg-orange-600"
                }
              `}
              aria-label={state.isRecording ? "녹음 중지" : "녹음 시작"}
            >
              {/* 펄스 애니메이션 (녹음 중일 때) */}
              {state.isRecording && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
                  <div className="absolute inset-0 animate-pulse rounded-full bg-red-300 opacity-50" />
                </>
              )}

              {/* 마이크 아이콘 */}
              {state.isRecording ? (
                <MicOff
                  className="relative h-10 w-10 text-white transition-transform group-hover:scale-110"
                  strokeWidth={2.5}
                />
              ) : (
                <Mic
                  className="relative h-10 w-10 text-white transition-transform group-hover:scale-110"
                  strokeWidth={2.5}
                />
              )}
            </button>

            <p
              className="text-sm text-text-secondary"
              style={{ letterSpacing: "-0.1px" }}
            >
              {state.isRecording ? "답변 중... 버튼을 눌러 완료하세요" : "버튼을 눌러 답변을 시작하세요"}
            </p>
          </div>
        )}

        {/* 다음 버튼 */}
        {state.currentQuestion && !state.isRecording && state.answers.length > state.questionIndex && (
          <Button
            variant="primary"
            size="lg"
            onClick={onNext}
            className="w-full"
          >
            다음 질문
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
