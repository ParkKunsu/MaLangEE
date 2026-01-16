"use client";

import React, { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import {
  type NicknameUpdateFormData,
  nicknameUpdateSchema,
  useCurrentUser,
  useNicknameCheck,
  useUpdateNickname,
} from "@/features/auth";
import { PopupLayout } from "@/shared/ui/PopupLayout";
import { Button, MalangEE } from "@/shared/ui";

// safeParse를 사용하는 커스텀 resolver (콘솔 에러 방지)
const nicknameUpdateResolver: Resolver<NicknameUpdateFormData> = async (values) => {
  const result = nicknameUpdateSchema.safeParse(values);

  if (result.success) {
    return { values: result.data, errors: {} };
  }

  const errors: Record<string, { type: string; message: string }> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (path) {
      errors[path] = {
        type: issue.code,
        message: issue.message,
      };
    }
  });

  return { values: {}, errors };
};

interface NicknameChangePopupProps {
  onClose: () => void;
  onSuccess?: (nickname: string) => void;
}

export const NicknameChangePopup: React.FC<NicknameChangePopupProps> = ({ onClose, onSuccess }) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NicknameUpdateFormData>({
    resolver: nicknameUpdateResolver,
  });

  const watchNewNickname = watch("new_nickname");
  const watchCurrentNickname = watch("current_nickname");

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
  const nicknameCheck = useNicknameCheck(watchNewNickname, { minLength: 2 });

  // 닉네임 변경 mutation
  const updateNicknameMutation = useUpdateNickname();

  // 기존 닉네임과 동일한지 실시간 체크
  const isSameAsCurrent = !!(watchNewNickname && watchCurrentNickname && watchNewNickname === watchCurrentNickname);

  useEffect(() => {
    if (isSameAsCurrent) {
      setValidationError("현재 사용중인 닉네임이에요");
    } else {
      setValidationError(null);
    }
  }, [isSameAsCurrent]);

  const onSubmit = (data: NicknameUpdateFormData) => {
    setValidationError(null);
    setSuccessMessage(null);

    // 현재 닉네임과 새로운 닉네임이 같은지 확인
    if (data.current_nickname === data.new_nickname) {
      setValidationError("현재 사용중인 닉네임이에요");
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
      onSuccess: (updatedUser) => {
        const nextNickname = updatedUser?.nickname || data.new_nickname;
        setSuccessMessage("닉네임이 변경되었습니다.");
        onSuccess?.(nextNickname);
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

  const isSubmitDisabled = !!(
    updateNicknameMutation.isPending ||
    (nicknameCheck.isChecking && !isSameAsCurrent) ||
    (!!nicknameCheck.error && !isSameAsCurrent) ||
    (!nicknameCheck.isAvailable && !isSameAsCurrent) ||
    !!successMessage ||
    isSameAsCurrent
  );

  return (
    <PopupLayout onClose={onClose} title={successMessage ? "" : "닉네임 변경"} maxWidth="md" showCloseButton={!successMessage}>
      {successMessage ? (
        <div className="flex flex-col items-center gap-6 py-4">
          <MalangEE size={120} />
          <div className="text-xl font-bold text-[#1F1C2B]">{successMessage}</div>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onClose}
          >
            확인
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* 기존 닉네임 입력 (읽기 전용) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1F1C2B]" style={{ letterSpacing: "-0.2px" }}>
              기존 닉네임
            </label>
            <div className="relative">
              <input
                id="current_nickname"
                type="text"
                placeholder="기존 닉네임"
                {...register("current_nickname")}
                readOnly
                className="h-12 w-full cursor-not-allowed rounded-full border border-[#d4d0df] bg-gray-100 px-5 text-sm text-[#1F1C2B] shadow-[0_2px_6px_rgba(0,0,0,0.03)] placeholder:text-[#8c869c]"
                style={{ letterSpacing: "-0.2px" }}
              />
              {errors.current_nickname && (
                <p className="mt-1 px-1 text-xs text-red-500">{errors.current_nickname.message}</p>
              )}
            </div>
          </div>

          {/* 새로운 닉네임 입력 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1F1C2B]" style={{ letterSpacing: "-0.2px" }}>
              새로운 닉네임
            </label>
            <div className="relative">
              <input
                id="new_nickname"
                type="text"
                placeholder="새로운 닉네임을 입력해주세요"
                {...register("new_nickname")}
                maxLength={6}
                className="h-12 w-full rounded-full border border-[#d4d0df] bg-white px-5 text-sm text-[#1F1C2B] shadow-[0_2px_6px_rgba(0,0,0,0.03)] placeholder:text-[#8c869c] focus:border-[#7B6CF6] focus:outline-none focus:ring-2 focus:ring-[#cfc5ff]"
                style={{ letterSpacing: "-0.2px" }}
              />
              
              {/* 메시지 표시 영역 통합 */}
              <div className="mt-1 px-1 min-h-[20px]">
                {/* 1. 확인 중 */}
                {nicknameCheck.isChecking && !isSameAsCurrent && (
                  <p className="text-xs text-blue-500">확인 중...</p>
                )}
                
                {/* 2. 폼 유효성 에러 (글자수 등) */}
                {errors.new_nickname && (
                  <p className="text-xs text-red-500">{errors.new_nickname.message}</p>
                )}
                
                {/* 3. API 중복 에러 (본인 닉네임 아닐 때만) */}
                {nicknameCheck.error && !errors.new_nickname && !isSameAsCurrent && (
                  <p className="text-xs text-red-500">{nicknameCheck.error}</p>
                )}
                
                {/* 4. 사용 가능 메시지 (본인 닉네임 아닐 때만) */}
                {!nicknameCheck.isChecking &&
                  !nicknameCheck.error &&
                  nicknameCheck.isAvailable &&
                  watchNewNickname &&
                  !isSameAsCurrent && (
                    <p className="text-xs text-green-600">사용 가능한 닉네임입니다</p>
                  )}

                {/* 5. 본인 닉네임 에러 (validationError) */}
                {validationError && (
                  <p className="text-xs text-red-500" style={{ letterSpacing: "-0.1px" }}>
                    *{validationError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={!!isSubmitDisabled}
            isLoading={!!updateNicknameMutation.isPending}
          >
            {updateNicknameMutation.isPending ? "변경 중..." : "변경하기"}
          </Button>
        </form>
      )}
    </PopupLayout>
  );
};
