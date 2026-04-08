import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario } from '@/types'
import { api } from '@/services/api'
import { useTiendaCarrito } from './useCartStore'
import { useUserStore } from './useUserStore'

interface TiendaAuth {
  usuario: Usuario | null
  token: string | null
  estaAutenticado: boolean
  errorLogin: string | null
  iniciarSesion: (email: string, contrasena: string) => Promise<boolean>
  cerrarSesion: () => void
  registrar: (datos: any) => Promise<boolean>
}

export const useTiendaAuth = create<TiendaAuth>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      estaAutenticado: false,
      errorLogin: null,

      iniciarSesion: async (email: string, contrasena: string) => {
        try {
          const resultado = await api.iniciarSesion(email, contrasena)
          
          if (resultado.exito && resultado.usuario && resultado.token) {
            set({ 
              usuario: resultado.usuario, 
              token: resultado.token,
              estaAutenticado: true,
              errorLogin: null
            })
            const establecerToken = useTiendaCarrito.getState().establecerToken
            setTimeout(() => establecerToken(resultado.token!), 0)
            return true
          }
          
          set({ errorLogin: resultado.error || 'Error al iniciar sesión' })
          return false
        } catch (error) {
          set({ errorLogin: 'Error de conexión. Verifica tu internet e intenta de nuevo.' })
          return false
        }
      },

      cerrarSesion: () => {
        set({ usuario: null, token: null, estaAutenticado: false })
        useTiendaCarrito.getState().vaciarCarrito()
        useUserStore.getState().logout()
      },

      registrar: async (datos: any) => {
        try {
          console.log('📝 Iniciando proceso de registro...');
          const resultado = await api.registrar(datos)
          
          console.log('📋 Resultado del registro:', resultado);
          
          if (resultado.exito) {
            console.log('✅ Registro exitoso, iniciando sesión automática...');
            // Si el registro fue exitoso, iniciar sesión automáticamente
            return await get().iniciarSesion(datos.email, datos.password)
          }
          
          console.error('❌ Error en registro:', resultado.error);
          return false
        } catch (error) {
          console.error('❌ Error al registrar:', error)
          return false
        }
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)

// Mantener compatibilidad con nombre anterior
export const useAuthStore = useTiendaAuth