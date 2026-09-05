import { create } from 'zustand';

interface PedidosStore {
  pedidos: any[];
  ultimaActualizacion: number;
  setPedidos: (pedidos: any[]) => void;
  actualizarEstado: (pedidoId: string, nuevoEstado: string) => void;
}

export const usePedidosStore = create<PedidosStore>((set) => ({
  pedidos: [],
  ultimaActualizacion: 0,
  setPedidos: (pedidos) => set({ pedidos, ultimaActualizacion: Date.now() }),
  actualizarEstado: (pedidoId, nuevoEstado) =>
    set((state) => ({
      pedidos: state.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      ),
      ultimaActualizacion: Date.now(),
    })),
}));
