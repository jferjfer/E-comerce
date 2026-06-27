import { create } from 'zustand';

interface AppPrefsStore {
  lenceriaConfirmada: boolean;
  confirmarLenceria: () => void;
  resetLenceria: () => void;
}

export const useAppPrefs = create<AppPrefsStore>((set) => ({
  lenceriaConfirmada: false,
  confirmarLenceria: () => set({ lenceriaConfirmada: true }),
  resetLenceria: () => set({ lenceriaConfirmada: false }),
}));
