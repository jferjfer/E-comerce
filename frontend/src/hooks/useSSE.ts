import { useEffect, useRef } from 'react'
import { API_URL } from '@/config/api'

type SSECallback = (datos: any) => void

export function useSSEPedidos(token: string | null, onPedidoActualizado: SSECallback) {
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!token) return

    const url = `${API_URL}/api/eventos/pedidos`
    const es = new EventSource(`${url}?token=${token}`)
    esRef.current = es

    es.addEventListener('pedido_actualizado', (e: MessageEvent) => {
      try {
        const datos = JSON.parse(e.data)
        console.log('📦 SSE pedido_actualizado:', datos)
        onPedidoActualizado(datos)
      } catch {}
    })

    es.onerror = () => {
      console.log('⚠️ SSE error, reconectando...')
    }

    es.onopen = () => {
      console.log('📡 SSE conectado')
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [token])
}
