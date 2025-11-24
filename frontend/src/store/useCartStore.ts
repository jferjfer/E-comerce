import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ItemCarrito, Producto } from '@/types'
import { api } from '@/services/api'

interface TiendaCarrito {
  items: ItemCarrito[]
  token?: string
  agregarItem: (producto: Producto) => void
  eliminarItem: (productoId: string) => void
  actualizarCantidad: (productoId: string, cantidad: number) => void
  vaciarCarrito: () => void
  obtenerTotalItems: () => number
  obtenerPrecioTotal: () => number
  establecerToken: (token: string) => void
  sincronizarConBackend: () => Promise<void>
}

export const useTiendaCarrito = create<TiendaCarrito>()(
  persist(
    (set, get) => ({
      items: [],
      token: undefined,
      
      agregarItem: async (producto: Producto) => {
        const { items, token } = get();
        const itemExistente = items.find(item => item.id === producto.id);
        
        console.log(`🛒 Agregando ${producto.nombre} al carrito local`);
        
        // Actualizar localmente primero para UX inmediata
        if (itemExistente) {
          set({
            items: items.map(item =>
              item.id === producto.id
                ? { ...item, cantidad: item.cantidad + 1 }
                : item
            )
          });
        } else {
          set({
            items: [...items, { ...producto, cantidad: 1 }]
          });
        }
        
        // Sincronizar con backend si hay token
        if (token) {
          try {
            const resultado = await api.agregarAlCarrito(token, producto.id, 1);
            if (resultado.error) {
              console.error('❌ Error del backend:', resultado.error);
              // Revertir cambio local si falla el backend
              if (itemExistente) {
                set({
                  items: items.map(item =>
                    item.id === producto.id
                      ? { ...item, cantidad: item.cantidad }
                      : item
                  )
                });
              } else {
                set({ items: items.filter(item => item.id !== producto.id) });
              }
            }
          } catch (error) {
            console.error('❌ Error de conexión al sincronizar carrito:', error);
          }
        }
      },
      
      eliminarItem: (productoId: string) => {
        set({
          items: get().items.filter(item => item.id !== productoId)
        })
      },
      
      actualizarCantidad: (productoId: string, cantidad: number) => {
        if (cantidad <= 0) {
          get().eliminarItem(productoId)
          return
        }
        
        set({
          items: get().items.map(item =>
            item.id === productoId
              ? { ...item, cantidad }
              : item
          )
        })
      },
      
      vaciarCarrito: () => set({ items: [] }),
      
      obtenerTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0)
      },
      
      obtenerPrecioTotal: () => {
        return get().items.reduce((total, item) => total + (item.precio * item.cantidad), 0)
      },
      
      establecerToken: (token: string) => {
        set({ token })
        get().sincronizarConBackend()
      },
      
      sincronizarConBackend: async () => {
        const { token } = get();
        if (!token) {
          console.log('🔄 No hay token, omitiendo sincronización de carrito');
          return;
        }
        
        try {
          console.log('🔄 Sincronizando carrito con backend...');
          const carritoBackend = await api.obtenerCarrito(token);
          set({ items: carritoBackend.items });
          console.log('✅ Carrito sincronizado exitosamente');
        } catch (error) {
          console.error('❌ Error al sincronizar carrito:', error);
        }
      }
    }),
    {
      name: 'carrito-storage'
    }
  )
)

// Mantener compatibilidad con nombre anterior
export const useCartStore = useTiendaCarrito