import { useEffect } from 'react'
import { API_URL } from '@/config/api'

export function useSSEPedidos(token: string | null, onPedidoActualizado: (datos: any) => void) {
  useEffect(() => {
    if (!token) return
    const es = new EventSource(`${API_URL}/api/eventos/pedidos?token=${token}`)
    es.addEventListener('pedido_actualizado', (e: MessageEvent) => {
      try { onPedidoActualizado(JSON.parse(e.data)) } catch {}
    })
    es.onopen = () => console.log('📡 SSE conectado')
    es.onerror = () => console.log('⚠️ SSE reconectando...')
    return () => es.close()
  }, [token])
}
