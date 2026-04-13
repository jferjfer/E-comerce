import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/useAuthStore'

import { API_URL } from '@/config/api'

const SOCKET_URL = API_URL

// Singleton — una sola conexión para toda la app
let socketInstance: Socket | null = null

export function getSocket(): Socket {
  if (!socketInstance) {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    socketInstance = io(SOCKET_URL, {
      transports: isProduction ? ['polling', 'websocket'] : ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      upgrade: true
    })
  }
  return socketInstance
}

export function useSocket() {
  const { usuario } = useAuthStore()

  useEffect(() => {
    const socket = getSocket()

    const identificarse = () => {
      if (!usuario) return
      socket.emit('identificar', String(usuario.id))
      const rolesAdmin = ['ceo', 'customer_success', 'logistics_coordinator',
        'operations_director', 'support_agent', 'marketing_manager',
        'product_manager', 'category_manager', 'seller_premium']
      if (rolesAdmin.includes(usuario.rol)) {
        socket.emit('unirse_admin', usuario.rol)
      }
      console.log(`👤 Identificado como usuario ${usuario.id}`)
    }

    // Identificarse si ya está conectado
    if (socket.connected) {
      identificarse()
    }

    // Identificarse en cada reconexión
    socket.on('connect', identificarse)

    return () => {
      socket.off('connect', identificarse)
    }
  }, [usuario])

  return getSocket()
}
