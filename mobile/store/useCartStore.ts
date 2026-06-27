import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemCarrito, Producto } from '@/types';
import { API_URL } from '@/constants';

// Helper para obtener token sin importar circular
const getToken = (): string | null => {
  try {
    const { useAuthStore } = require('@/store/useAuthStore');
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
};

const fetchCarrito = async (method: string, path: string, body?: any) => {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {}
};

interface CartStore {
  items: ItemCarrito[];
  agregarItem: (producto: Producto, talla?: string, color?: string) => void;
  eliminarItem: (productoId: string) => void;
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  totalItems: () => number;
  totalPrecio: () => number;
  sincronizarDesdeBackend: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      agregarItem: (producto, talla, color) => {
        const items = get().items;
        const existe = items.find(
          i => i.id === producto.id && i.talla === talla && i.color === color
        );
        if (existe) {
          set({
            items: items.map(i =>
              i.id === producto.id && i.talla === talla && i.color === color
                ? { ...i, cantidad: i.cantidad + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...producto, cantidad: 1, talla, color }] });
        }
        // Sincronizar con backend
        fetchCarrito('POST', '/api/carrito', { id_producto: producto.id, cantidad: 1 });
      },

      eliminarItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
        fetchCarrito('DELETE', `/api/carrito/${id}`);
      },

      actualizarCantidad: (id, cantidad) => {
        if (cantidad <= 0) {
          get().eliminarItem(id);
          return;
        }
        set({ items: get().items.map(i => i.id === id ? { ...i, cantidad } : i) });
        fetchCarrito('PUT', `/api/carrito/${id}`, { cantidad });
      },

      vaciarCarrito: () => {
        set({ items: [] });
        fetchCarrito('DELETE', '/api/carrito');
      },

      totalItems: () => get().items.reduce((t, i) => t + i.cantidad, 0),
      totalPrecio: () => get().items.reduce((t, i) => t + i.precio * i.cantidad, 0),

      sincronizarDesdeBackend: async () => {
        const token = getToken();
        if (!token) return;
        try {
          const res = await fetch(`${API_URL}/api/carrito`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const data = await res.json();
          const items: ItemCarrito[] = (data.datos?.productos || data.items || []).map((item: any) => ({
            id: item.id?.toString() || '',
            nombre: item.nombre || '',
            precio: item.precio || 0,
            imagen: item.imagen || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
            descripcion: item.descripcion || '',
            categoria: item.categoria || '',
            tallas: item.tallas || [],
            colores: item.colores || [],
            calificacion: item.calificacion || 5,
            en_stock: item.en_stock !== false,
            es_eco: item.es_eco || false,
            cantidad: item.cantidad || 1,
            talla: item.talla || undefined,
            color: item.color || undefined,
          }));
          if (items.length > 0) set({ items });
        } catch {}
      },
    }),
    { name: 'cart-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
