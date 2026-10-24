import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario } from '@/types';
import { api } from '@/services/api';
import { API_URL } from '@/constants';
import { secureStorage, limpiarRateLimit, verificarRateLimit, actualizarActividad } from '@/utils/security';

const SECURE_TOKEN_KEY = 'egos_auth_token';

// Decodificar JWT payload — compatible con Hermes RN 0.76 sin atob ni TextDecoder
function decodeJwtPayload(token: string): any {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;

    // Base64url → base64 estándar
    const b64 = base64.replace(/-/g, '+').replace(/_/g, '/') +
      '=='.slice(0, (4 - base64.length % 4) % 4);

    // Decodificar base64 manualmente sin atob ni TextDecoder
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < b64.length) {
      const a = chars.indexOf(b64[i++]);
      const b = chars.indexOf(b64[i++]);
      const c = chars.indexOf(b64[i++]);
      const d = chars.indexOf(b64[i++]);
      if (a < 0 || b < 0) break;
      result += String.fromCharCode((a << 2) | (b >> 4));
      if (c >= 0) result += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d >= 0) result += String.fromCharCode(((c & 3) << 6) | d);
    }

    // Decodificar UTF-8 manualmente
    let utf8 = '';
    let j = 0;
    while (j < result.length) {
      const code = result.charCodeAt(j++);
      if (code < 128) {
        utf8 += String.fromCharCode(code);
      } else if (code > 191 && code < 224) {
        utf8 += String.fromCharCode(((code & 31) << 6) | (result.charCodeAt(j++) & 63));
      } else {
        utf8 += String.fromCharCode(
          ((code & 15) << 12) |
          ((result.charCodeAt(j++) & 63) << 6) |
          (result.charCodeAt(j++) & 63)
        );
      }
    }

    return JSON.parse(utf8);
  } catch {
    return null;
  }
}

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
        try {
          const token = await secureStorage.get(SECURE_TOKEN_KEY);
          if (token) {
            try {
              const payload = decodeJwtPayload(token);
              if (payload?.exp && payload.exp * 1000 < Date.now()) {
                await secureStorage.delete(SECURE_TOKEN_KEY);
                return;
              }
            } catch {}
            set({ token, estaAutenticado: true });
            actualizarActividad();
          }
        } catch {}
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
        secureStorage.delete(SECURE_TOKEN_KEY).catch(() => {});
        set({ usuario: null, token: null, estaAutenticado: false });
        // Limpiar stores secundarios de forma síncrona para evitar setState en componentes desmontados
        try {
          const cartMod = require('@/store/useCartStore');
          cartMod.useCartStore.getState().vaciarCarrito();
        } catch {}
        try {
          const userMod = require('@/store/useUserStore');
          userMod.useUserStore.getState().logout();
        } catch {}
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
        // estaAutenticado NO se persiste — siempre arranca en false hasta verificar token
        // token NO se persiste en AsyncStorage
      }),
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
