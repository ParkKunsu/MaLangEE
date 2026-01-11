"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type NicknameUpdateFormData,
  nicknameUpdateSchema,
  useCurrentUser,
  useNicknameCheck,
  useUpdateNickname,
} from "@/features/auth";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { Button } from "@/shared/ui";

interface NicknameChangePopupProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NicknameChangePopup: React.FC<NicknameChangePopupProps> = ({
  onClose,
  onSuccess,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NicknameUpdateFormData>({
    resolver: zodResolver(nicknameUpdateSchema),
  });

  const watchNewNickname = watch("new_nickname");

  // 현재 사용자 닉네임을 기존 닉네임 필드에 자동 설정
  useEffect(() => {
    if (currentUser?.nickname) {
      setValue("current_nickname", currentUser.nickname);
    } else if (currentUser) {
      // 닉네임이 없는 경우 login_id 사용
      setValue("current_nickname", currentUser.login_id);
    }
  }, [currentUser, setValue]);

  // 새로운 닉네임 중복 확인 훅
  const nicknameCheck = useNicknameCheck(watchNewNickname);

  // 닉네임 변경 mutation
  const updateNicknameMutation = useUpdateNickname();

  const onSubmit = (data: NicknameUpdateFormData) => {
    setValidationError(null);

    // 현재 닉네임과 새로운 닉네임이 같은지 확인
    if (data.current_nickname === data.new_nickname) {
      setValidationError("기존 닉네임과 동일합니다");
      return;
    }

    // 유효성 검사 오류가 있는지 확인
    if (nicknameCheck.error) {
      setValidationError("새로운 닉네임을 확인해주세요");
      return;
    }

    // 중복 체크가 완료되지 않았거나 사용 불가능한 경우
    if (!nicknameCheck.isAvailable) {
      setValidationError("새로운 닉네임을 확인해주세요");
      return;
    }

    updateNicknameMutation.mutate(data, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        if (error instanceof Error) {
          const message = error.message;
          if (message.includes("이미")) {
            setValidationError(message);
          } else {
            setValidationError("닉네임 변경에 실패했습니다. 입력 정보를 확인해주세요.");
          }
        }
      },
    });
  };

  const isSubmitDisabled =
    updateNicknameMutation.isPending ||
    nicknameCheck.isChecking ||
    !!nicknameCheck.error ||
    !nicknameCheck.isAvailable;

  return (
    <PopupLayout onClose={onClose} title="닉네임 변경" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* 기존 닉네임 입력 (읽기 전용) */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#1F1C2B]"
                style={{ letterSpacing: "-0.2px" }}
              >
                기존 닉네임
              </label>
              <div className="relative">
                <input
                  id="current_nickname"
                  type="text"
                  placeholder="기존 닉네임"
                  {...register("current_nickname")}
                  readOnly
                  className="h-[48px] w-full cursor-not-allowed rounded-full border border-[#d4d0df] bg-gray-100 px-5 text-sm text-[#1F1C2B] shadow-[0_2px_6px_rgba(0,0,0,0.03)] placeholder:text-[#8c869c]"
                  style={{ letterSpacing: "-0.2px" }}
                />
                {errors.current_nickname && (
                  <p className="mt-1 px-1 text-xs text-red-500">
                    {errors.current_nickname.message}
                  </p>
                )}
              </div>
            </div>

            {/* 새로운 닉네임 입력 */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[#1F1C2B]"
                style={{ letterSpacing: "-0.2px" }}
              >
                새로운 닉네임
              </label>
              <div className="relative">
                <input
                  id="new_nickname"
                  type="text"
                  placeholder="새로운 닉네임을 입력해주세요"
                  {...register("new_nickname")}
                  className="h-[48px] w-full rounded-full border border-[#d4d0df] bg-white px-5 text-sm text-[#1F1C2B] shadow-[0_2px_6px_rgba(0,0,0,0.03)] placeholder:text-[#8c869c] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                  style={{ letterSpacing: "-0.2px" }}
                />
                {nicknameCheck.isChecking && (
                  <p className="mt-1 px-1 text-xs text-blue-500">확인 중...</p>
                )}
                {errors.new_nickname && (
                  <p className="mt-1 px-1 text-xs text-red-500">{errors.new_nickname.message}</p>
                )}
                {nicknameCheck.error && !errors.new_nickname && (
                  <p className="mt-1 px-1 text-xs text-red-500">{nicknameCheck.error}</p>
                )}
                {!nicknameCheck.isChecking &&
                  !nicknameCheck.error &&
                  nicknameCheck.isAvailable &&
                  watchNewNickname && (
                    <p className="mt-1 px-1 text-xs text-green-600">사용 가능한 닉네임입니다</p>
                  )}
              </div>
            </div>

            {validationError && (
              <p className="px-1 text-xs text-red-500" style={{ letterSpacing: "-0.1px" }}>
                *{validationError}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={isSubmitDisabled}
              isLoading={updateNicknameMutation.isPending}
            >
              {updateNicknameMutation.isPending ? "변경 중..." : "변경하기"}
            </Button>
          </form>
    </PopupLayout>
  );
};
