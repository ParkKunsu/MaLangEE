import { create } from 'zustand';

type PopupType = 'logout' | 'deleteUser' | null;

interface PopupState {
  type: PopupType;
  isOpen: boolean;
  openPopup: (type: PopupType) => void;
  closePopup: () => void;
}

export const usePopupStore = create<PopupState>((set) => ({
  type: null,
  isOpen: false,
  openPopup: (type) => set({ type, isOpen: true }),
  closePopup: () => set({ type: null, isOpen: false }),
}));
