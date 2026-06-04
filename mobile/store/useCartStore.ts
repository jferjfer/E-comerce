import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemCarrito, Producto } from '@/types';

interface CartStore {
  items: ItemCarrito[];
  agregarItem: (producto: Producto, talla?: string, color?: string) => void;
  eliminarItem: (productoId: string) => void;
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  totalItems: () => number;
  totalPrecio: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      agregarItem: (producto, talla, color) => {
        const items = get().items;
        const existe = items.find(
          (i) => i.id === producto.id && i.talla === talla && i.color === color
        );
        if (existe) {
          set({
            items: items.map((i) =>
              i.id === producto.id && i.talla === talla && i.color === color
                ? { ...i, cantidad: i.cantidad + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...producto, cantidad: 1, talla, color }] });
        }
      },

      eliminarItem: (productoId) => {
        set({ items: get().items.filter((i) => i.id !== productoId) });
      },

      actualizarCantidad: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().eliminarItem(productoId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === productoId ? { ...i, cantidad } : i
          ),
        });
      },

      vaciarCarrito: () => set({ items: [] }),

      totalItems: () => get().items.reduce((t, i) => t + i.cantidad, 0),

      totalPrecio: () =>
        get().items.reduce((t, i) => t + i.precio * i.cantidad, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
