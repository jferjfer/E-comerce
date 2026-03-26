import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/useAuthStore'

const SOCKET_URL = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : (import.meta.env.VITE_API_URL || 'http://149.130.182.9:3000')

// Singleton — una sola conexión para toda la app
let socketInstance: Socket | null = null

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    })
  }
  return socketInstance
}

export function useSocket() {
  const { usuario } = useAuthStore()
  const identificado = useRef(false)

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => {
      console.log('🔌 WebSocket conectado')
      if (usuario && !identificado.current) {
        socket.emit('identificar', String(usuario.id))

        // Roles admin se unen a sala de admins
        const rolesAdmin = ['ceo', 'customer_success', 'logistics_coordinator',
          'operations_director', 'support_agent', 'marketing_manager',
          'product_manager', 'category_manager', 'seller_premium']
        if (rolesAdmin.includes(usuario.rol)) {
          socket.emit('unirse_admin', usuario.rol)
        }
        identificado.current = true
      }
    }

    if (socket.connected) {
      onConnect()
    } else {
      socket.on('connect', onConnect)
    }

    return () => {
      socket.off('connect', onConnect)
      identificado.current = false
    }
  }, [usuario])

  return getSocket()
}
