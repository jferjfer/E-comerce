import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { API_URL } from '@/constants';

// En Expo Go socket.io-client tiene problemas con módulos Node.js.
// Usamos SSE (Server-Sent Events) como en el frontend web, con polling de fallback.

const ETIQUETAS: Record<string, { texto: string; tipo: 'success' | 'info' | 'warning' | 'error' }> = {
  Confirmado:  { texto: '✅ confirmado y en preparación', tipo: 'success' },
  Enviado:     { texto: '🚚 enviado — ¡está en camino!', tipo: 'info' },
  'En Camino': { texto: '🚚 en camino', tipo: 'info' },
  Entregado:   { texto: '🎉 entregado exitosamente', tipo: 'success' },
  Cancelado:   { texto: '❌ cancelado', tipo: 'error' },
};

export function useSocketNotificaciones() {
  const { usuario, token } = useAuthStore();
  const addNotification = useNotificationStore(s => s.addNotification);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimoEstadoRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!usuario || !token) return;

    // Polling cada 30 segundos para detectar cambios de estado en pedidos
    const verificar = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const pedidos: any[] = data.pedidos || [];

        pedidos.forEach(pedido => {
          const estadoAnterior = ultimoEstadoRef.current[pedido.id];
          const estadoActual = pedido.estado;

          if (estadoAnterior && estadoAnterior !== estadoActual) {
            const etiqueta = ETIQUETAS[estadoActual];
            if (etiqueta) {
              addNotification(
                `Pedido #${String(pedido.id).slice(-8)} ${etiqueta.texto}`,
                etiqueta.tipo
              );
            }
          }
          ultimoEstadoRef.current[pedido.id] = estadoActual;
        });
      } catch {}
    };

    // Primera carga — solo guardar estados, no notificar
    const inicializar = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        (data.pedidos || []).forEach((p: any) => {
          ultimoEstadoRef.current[p.id] = p.estado;
        });
      } catch {}
    };

    inicializar().then(() => {
      pollingRef.current = setInterval(verificar, 30000);
    });

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [usuario?.id, token]);
}
