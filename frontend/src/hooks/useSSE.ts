import { useEffect, useRef } from 'react'
import { API_URL } from '@/config/api'

export function useSSEPedidos(token: string | null, onPedidoActualizado: (datos: any) => void) {
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const retryDelay = useRef(3000)

  useEffect(() => {
    if (!token) return

    const conectar = () => {
      if (esRef.current) esRef.current.close()

      const es = new EventSource(`${API_URL}/api/eventos/pedidos?token=${token}`)
      esRef.current = es

      es.addEventListener('pedido_actualizado', (e: MessageEvent) => {
        try { onPedidoActualizado(JSON.parse(e.data)) } catch {}
      })

      es.onopen = () => {
        retryDelay.current = 3000 // reset delay al conectar
      }

      es.onerror = () => {
        es.close()
        // Reconectar con backoff (máx 30s)
        retryRef.current = setTimeout(() => {
          retryDelay.current = Math.min(retryDelay.current * 1.5, 30000)
          conectar()
        }, retryDelay.current)
      }
    }

    conectar()

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (esRef.current) esRef.current.close()
    }
  }, [token])
}
