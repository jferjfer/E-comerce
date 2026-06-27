import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants';

const getToken = (): string | null => {
  try {
    const { useAuthStore } = require('@/store/useAuthStore');
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
};

interface UserStore {
  favorites: string[];
  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addToFavorites: (id) => {
        if (get().favorites.includes(id)) return;
        set({ favorites: [...get().favorites, id] });
        // Sincronizar con backend
        const token = getToken();
        if (token) {
          fetch(`${API_URL}/api/listas-deseos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ producto_id: id }),
          }).catch(() => {});
        }
      },

      removeFromFavorites: (id) => {
        set({ favorites: get().favorites.filter(f => f !== id) });
        // Sincronizar con backend
        const token = getToken();
        if (token) {
          fetch(`${API_URL}/api/listas-deseos/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      },

      isFavorite: (id) => get().favorites.includes(id),

      logout: () => set({ favorites: [] }),
    }),
    { name: 'user-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
