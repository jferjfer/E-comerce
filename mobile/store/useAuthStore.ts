import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario } from '@/types';
import { api } from '@/services/api';

interface AuthStore {
  usuario: Usuario | null;
  token: string | null;
  estaAutenticado: boolean;
  errorLogin: string | null;
  iniciarSesion: (email: string, password: string) => Promise<boolean>;
  cerrarSesion: () => void;
  registrar: (datos: any) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      estaAutenticado: false,
      errorLogin: null,

      iniciarSesion: async (email, password) => {
        try {
          const data = await api.login(email, password);
          if (data.token || data.datos?.token) {
            const usuario = data.usuario || data.datos?.usuario;
            const token = data.token || data.datos?.token;
            set({ usuario, token, estaAutenticado: true, errorLogin: null });
            return true;
          }
          set({ errorLogin: data.error || 'Credenciales inválidas' });
          return false;
        } catch {
          set({ errorLogin: 'Error de conexión' });
          return false;
        }
      },

      cerrarSesion: () => {
        set({ usuario: null, token: null, estaAutenticado: false });
      },

      registrar: async (datos) => {
        try {
          const data = await api.register(datos);
          if (data.exito) {
            return await get().iniciarSesion(datos.email, datos.password);
          }
          set({ errorLogin: data.error || 'Error al registrarse' });
          return false;
        } catch {
          set({ errorLogin: 'Error de conexión' });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
