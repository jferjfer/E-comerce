import { useEffect } from 'react'
import { API_URL } from '@/config/api'

type SSECallback = (datos: any) => void

export function useSSEPedidos(token: string | null, onPedidoActualizado: SSECallback) {
  useEffect(() => {
    if (!token) return

    const es = new EventSource(`${API_URL}/api/eventos/pedidos?token=${token}`)

    es.addEventListener('pedido_actualizado', (e: MessageEvent) => {
      try {
        const datos = JSON.parse(e.data)
        console.log('📦 SSE pedido_actualizado:', datos)
        onPedidoActualizado(datos)
      } catch {}
    })

    es.onopen = () => console.log('📡 SSE conectado')
    es.onerror = () => console.log('⚠️ SSE reconectando...')

    return () => es.close()
  }, [token])
}
