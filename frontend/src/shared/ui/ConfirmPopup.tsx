"use client";

import type { FC, ReactNode } from "react";
import { PopupLayout } from "./PopupLayout";
import { Button } from "./Button";
import { MalangEE, type MalangEEStatus } from "./MalangEE";

interface ConfirmPopupProps {
  /** 팝업 메시지 (문자열 또는 ReactNode) */
  message: ReactNode;
  /** 확인 버튼 텍스트 */
  confirmText?: string;
  /** 취소 버튼 텍스트 */
  cancelText?: string;
  /** 확인 버튼 클릭 핸들러 */
  onConfirm: () => void;
  /** 취소 버튼 클릭 핸들러 */
  onCancel: () => void;
  /** 버튼 스타일 변형 */
  variant?: "default" | "danger";
  /** 말랭이 표시 여부 */
  showMalangEE?: boolean;
  /** 말랭이 상태 */
  malangEEStatus?: MalangEEStatus;
  /** 팝업 최대 너비 */
  maxWidth?: "sm" | "md" | "lg";
}

export const ConfirmPopup: FC<ConfirmPopupProps> = ({
  message,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  variant = "default",
  showMalangEE = false,
  malangEEStatus = "default",
  maxWidth = "md",
}) => {
  return (
    <PopupLayout onClose={onCancel} maxWidth={maxWidth} showCloseButton={false}>
      <div className="flex flex-col items-center gap-6 py-4">
        {showMalangEE && <MalangEE status={malangEEStatus} size={120} />}
        <div className="text-center">
          {typeof message === "string" ? (
            <p className="text-xl font-semibold leading-relaxed text-gray-800">
              {message}
            </p>
          ) : (
            message
          )}
        </div>
        <div className="flex w-full gap-3">
          <Button
            onClick={onCancel}
            variant="outline-gray"
            size="md"
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant === "danger" ? "primary" : "primary"}
            size="md"
            className={`flex-1 ${variant === "danger" ? "bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600" : ""}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </PopupLayout>
  );
};
