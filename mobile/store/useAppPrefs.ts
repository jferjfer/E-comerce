import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppPrefsStore {
  lenceriaConfirmada: boolean;
  confirmarLenceria: () => void;
  resetLenceria: () => void;
}

export const useAppPrefs = create<AppPrefsStore>()(
  persist(
    (set) => ({
      lenceriaConfirmada: false,
      confirmarLenceria: () => set({ lenceriaConfirmada: true }),
      resetLenceria: () => set({ lenceriaConfirmada: false }),
    }),
    {
      name: 'app-prefs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
