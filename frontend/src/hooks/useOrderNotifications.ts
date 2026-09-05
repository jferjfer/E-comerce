import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSocket } from './useSocket'

const ETIQUETAS: Record<string, { texto: string; tipo: 'success' | 'info' | 'warning' | 'error' }> = {
  Confirmado: { texto: '✅ confirmado y en preparación', tipo: 'success' },
  Enviado:    { texto: '🚚 enviado — ¡está en camino!', tipo: 'info' },
  Entregado:  { texto: '🎉 entregado exitosamente', tipo: 'success' },
  Cancelado:  { texto: '❌ cancelado', tipo: 'error' },
}

export const useOrderNotifications = () => {
  const { usuario } = useAuthStore()
  const addNotification = useNotificationStore(state => state.addNotification)
  const socket = useSocket()

  useEffect(() => {
    if (!usuario) return

    const onPedidoActualizado = (datos: any) => {
      const etiqueta = ETIQUETAS[datos.estado_nuevo]
      if (etiqueta) {
        addNotification(
          `Pedido #${String(datos.pedidoId).slice(-8)} ${etiqueta.texto}`,
          etiqueta.tipo
        )
      }
    }

    socket.on('pedido_actualizado', onPedidoActualizado)
    return () => { socket.off('pedido_actualizado', onPedidoActualizado) }
  }, [usuario, socket])
}
