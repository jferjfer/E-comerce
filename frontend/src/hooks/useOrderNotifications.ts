import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'

export const useOrderNotifications = () => {
  const { token } = useAuthStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  useEffect(() => {
    if (!token) return

    // Polling cada 30 segundos para verificar cambios
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/pedidos', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        // Verificar si hay pedidos con cambios recientes (últimos 2 minutos)
        const pedidosRecientes = data.pedidos?.filter((pedido: any) => {
          const fechaActualizacion = new Date(pedido.fecha_actualizacion)
          const ahora = new Date()
          const diferencia = (ahora.getTime() - fechaActualizacion.getTime()) / 1000 / 60
          return diferencia < 2
        })

        if (pedidosRecientes?.length > 0) {
          pedidosRecientes.forEach((pedido: any) => {
            addNotification(
              `Tu pedido #${pedido.id.slice(0, 8)} cambió a: ${pedido.estado}`,
              'info'
            )
          })
        }
      } catch (error) {
        console.error('Error verificando pedidos:', error)
      }
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [token])
}
