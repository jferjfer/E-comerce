// Store simple para comunicar que el splash terminó
import { create } from 'zustand';

interface AppStore {
  splashDone: boolean;
  setSplashDone: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  splashDone: false,
  setSplashDone: () => set({ splashDone: true }),
}));
