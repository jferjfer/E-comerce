import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario } from '@/types';
import { api } from '@/services/api';
import { API_URL } from '@/constants';
import { secureStorage, limpiarRateLimit, verificarRateLimit, actualizarActividad } from '@/utils/security';

const SECURE_TOKEN_KEY = 'egos_auth_token';

interface AuthStore {
  usuario: Usuario | null;
  token: string | null;
  estaAutenticado: boolean;
  errorLogin: string | null;
  iniciarSesion: (email: string, password: string) => Promise<boolean>;
  cerrarSesion: () => void;
  registrar: (datos: any) => Promise<boolean>;
  cargarTokenSeguro: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      estaAutenticado: false,
      errorLogin: null,

      // Cargar token desde SecureStore al iniciar
      cargarTokenSeguro: async () => {
        const token = await secureStorage.get(SECURE_TOKEN_KEY);
        if (token) {
          // Si hay token en SecureStore, restaurar sesion
          set({ token, estaAutenticado: true });
          actualizarActividad();
        }
      },

      iniciarSesion: async (email, password) => {
        // Rate limiting cliente
        const rl = verificarRateLimit(email);
        if (!rl.permitido) {
          set({ errorLogin: `Demasiados intentos. Espera ${rl.esperarSegundos} segundos.` });
          return false;
        }

        try {
          const data = await api.login(email, password);
          if (data.token || data.datos?.token) {
            const usuario = data.usuario || data.datos?.usuario;
            const token = data.token || data.datos?.token;

            // Guardar token en SecureStore (cifrado) en vez de AsyncStorage
            await secureStorage.set(SECURE_TOKEN_KEY, token);

            set({ usuario, token, estaAutenticado: true, errorLogin: null });
            limpiarRateLimit(email);
            actualizarActividad();

            // Sincronizar carrito y favoritos
            setTimeout(async () => {
              try {
                const { useCartStore } = await import('@/store/useCartStore');
                await useCartStore.getState().sincronizarDesdeBackend();
              } catch {}
            }, 0);

            setTimeout(async () => {
              try {
                const res = await fetch(`${API_URL}/api/listas-deseos`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  const dataFav = await res.json();
                  const favIds: string[] = (dataFav.productos || []).map((p: any) => String(p));
                  const { useUserStore } = await import('@/store/useUserStore');
                  const store = useUserStore.getState();
                  favIds.forEach(id => { if (!store.isFavorite(id)) store.addToFavorites(id); });
                }
              } catch {}
            }, 0);

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
        // Eliminar token del SecureStore
        secureStorage.delete(SECURE_TOKEN_KEY);
        set({ usuario: null, token: null, estaAutenticado: false });
        setTimeout(async () => {
          try {
            const { useCartStore } = await import('@/store/useCartStore');
            useCartStore.getState().vaciarCarrito();
            const { useUserStore } = await import('@/store/useUserStore');
            useUserStore.getState().logout();
          } catch {}
        }, 0);
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
      // Solo persistir datos NO sensibles en AsyncStorage
      // El token se guarda en SecureStore por separado
      partialize: (state) => ({
        usuario: state.usuario,
        estaAutenticado: state.estaAutenticado,
        // token NO se persiste en AsyncStorage
      }),
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
