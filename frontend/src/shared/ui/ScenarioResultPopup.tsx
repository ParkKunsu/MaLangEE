"use client";

import type { FC } from "react";
import { MapPin, Users, Target } from "lucide-react";
import { PopupLayout } from "./PopupLayout";
import { Button } from "./Button";

export interface ScenarioResult {
  /** 대화 장소 */
  place?: string;
  /** 대화 상대 */
  conversationPartner?: string;
  /** 대화 목표/미션 */
  conversationGoal?: string;
}

interface ScenarioResultPopupProps {
  /** 시나리오 결과 데이터 */
  scenarioResult: ScenarioResult;
  /** 확인(다음단계) 버튼 클릭 핸들러 */
  onConfirm: () => void;
  /** 취소(다시정하기) 버튼 클릭 핸들러 */
  onCancel: () => void;
  /** 확인 버튼 텍스트 */
  confirmText?: string;
  /** 취소 버튼 텍스트 */
  cancelText?: string;
  /** 팝업 제목 */
  title?: string;
  /** 팝업 부제목 */
  subtitle?: string;
}

export const ScenarioResultPopup: FC<ScenarioResultPopupProps> = ({
  scenarioResult,
  onConfirm,
  onCancel,
  confirmText = "다음단계",
  cancelText = "주제 다시 정하기",
  title = "좋아요! 상황을 파악했어요.",
  subtitle = "연습할 시나리오 정보를 확인해주세요.",
}) => {
  return (
    <PopupLayout
      onClose={onCancel}
      maxWidth="md"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center gap-8 py-6">
        <div className="w-full space-y-6">
          <div className="text-center">
            <h2 className="text-text-primary text-2xl font-bold tracking-tight">
              {title}
            </h2>
            <p className="text-text-secondary mt-2 text-sm">{subtitle}</p>
          </div>
          <div className="grid gap-3">
            {/* 연습 장소 */}
            <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <MapPin size={20} className="text-brand" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-tight text-gray-400">
                  연습 장소
                </span>
                <p className="text-text-primary font-bold">
                  {scenarioResult.place || "알수없음"}
                </p>
              </div>
            </div>

            {/* 대화 상대 */}
            <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Users size={20} className="text-brand" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-tight text-gray-400">
                  대화 상대
                </span>
                <p className="text-text-primary font-bold">
                  {scenarioResult.conversationPartner || "알수없음"}
                </p>
              </div>
            </div>

            {/* 나의 미션 */}
            <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Target size={20} className="text-brand" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-tight text-gray-400">
                  나의 미션
                </span>
                <p className="text-text-primary font-bold leading-snug">
                  {scenarioResult.conversationGoal || "알수없음"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="mt-2 flex w-full gap-3">
          <Button
            onClick={onCancel}
            variant="outline-purple"
            className="flex-1"
            size="lg"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </PopupLayout>
  );
};
