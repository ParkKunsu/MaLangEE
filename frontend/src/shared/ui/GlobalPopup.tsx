"use client";

import { usePopupStore } from "@/shared/lib/store";
import { PopupLayout } from "./PopupLayout";
import { Button } from "./Button";
import { MalangEE } from "./MalangEE";
import { useAuth, useDeleteUser } from "@/features/auth";

export const GlobalPopup = () => {
  const { type, isOpen, closePopup } = usePopupStore();
  const { logout } = useAuth();
  const { mutate: deleteUser, isPending: isDeletingUser } = useDeleteUser();

  if (!isOpen) return null;

  const handleLogoutConfirm = () => {
    logout();
    closePopup();
  };

  const handleDeleteUserConfirm = () => {
    deleteUser(undefined, {
      onSuccess: () => {
        closePopup();
      },
    });
  };

  return (
    <>
      {type === "logout" && (
        <PopupLayout onClose={closePopup} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="humm" size={120} />
            <div className="text-xl font-bold text-[#1F1C2B]">정말 로그아웃 하실건가요?</div>
            <div className="flex w-full gap-3">
              <Button variant="outline-purple" size="md" fullWidth onClick={closePopup}>
                닫기
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleLogoutConfirm}>
                로그아웃
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}

      {type === "deleteUser" && (
        <PopupLayout onClose={closePopup} showCloseButton={false} maxWidth="sm">
          <div className="flex flex-col items-center gap-6 py-2">
            <MalangEE status="sad" size={120} />
            <div className="text-center">
              <div className="text-xl font-bold text-[#1F1C2B]">정말 탈퇴하시겠어요?</div>
              <div className="mt-2 text-sm text-gray-500">
                탈퇴 시 모든 대화 기록이 삭제되며 복구할 수 없습니다.
              </div>
            </div>
            <div className="flex w-full gap-3">
              <Button variant="outline-purple" size="md" fullWidth onClick={closePopup}>
                취소
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleDeleteUserConfirm}
                disabled={isDeletingUser}
                className="bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600"
              >
                {isDeletingUser ? "탈퇴 중..." : "탈퇴하기"}
              </Button>
            </div>
          </div>
        </PopupLayout>
      )}
    </>
  );
};
