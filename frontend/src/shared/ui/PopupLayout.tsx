"use client";

import React, { type ReactNode } from "react";
import { X } from "lucide-react";

interface PopupLayoutProps {
  children: ReactNode;
  onClose: () => void;
  title?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  showCloseButton?: boolean;
  headerContent?: ReactNode; // 제목 대신 커스텀 헤더 컨텐츠
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export const PopupLayout: React.FC<PopupLayoutProps> = ({
  children,
  onClose,
  title,
  maxWidth = "2xl",
  showCloseButton = true,
  headerContent,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative mx-4 w-full ${maxWidthClasses[maxWidth]} rounded-[32px] border border-white/60 bg-white shadow-[0_20px_80px_rgba(123,108,246,0.3)] backdrop-blur-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 - 상단 우측에 absolute 배치 */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-gray-600 z-10"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        )}

        <div className="space-y-6 px-8 py-8">
          {/* 헤더 영역 */}
          {(title || headerContent) && (
            <div className="flex items-center">
              {headerContent ? (
                headerContent
              ) : title ? (
                <h2 className="text-2xl font-bold text-[#1F1C2B]">{title}</h2>
              ) : null}
            </div>
          )}

          {/* 본문 영역 */}
          {children}
        </div>
      </div>
    </div>
  );
};
