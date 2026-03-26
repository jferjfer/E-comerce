import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatPrice } from '@/utils/sanitize'
import { useSocket } from '@/hooks/useSocket'

interface Pedido {
  id: string
  usuario_id: number
  estado: string
  total: number
  fecha_creacion: string
  productos: any[]
  nombre_cliente: string
  email_cliente: string
}

interface Devolucion {
  id: number
  id_pedido: string
  usuario_id: number
  razon: string
  estado: string
  fecha_creacion: string
  monto_pedido: number
  nombre_cliente: string
  email_cliente: string
}

export default function CustomerSuccessDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [tab, setTab] = useState<'pedidos' | 'devoluciones'>('pedidos')
  const { token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const socket = useSocket()

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [resPedidos, resDevoluciones] = await Promise.all([
        fetch('http://localhost:3000/api/admin/pedidos?estado=Creado', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),
        fetch('http://localhost:3000/api/devoluciones?estado=Solicitada', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())
      ])
      setPedidos(resPedidos.pedidos || [])
      setDevoluciones(resDevoluciones.devoluciones || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  // Tiempo real: nuevo pedido o cambio de estado
  useEffect(() => {
    const recargar = () => cargarDatos()
    socket.on('pedido_nuevo', recargar)
    socket.on('pedido_actualizado', recargar)
    return () => {
      socket.off('pedido_nuevo', recargar)
      socket.off('pedido_actualizado', recargar)
    }
  }, [socket])

  const cambiarEstadoPedido = async (pedidoId: string, nuevoEstado: string, comentario: string) => {
    setProcesando(pedidoId)
    try {
      const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nuevoEstado, comentario })
      })
      if (response.ok) {
        addNotification(`Pedido ${pedidoId} → ${nuevoEstado}`, 'success')
        cargarDatos()
      } else {
        const data = await response.json()
        addNotification(data.error || 'Error al actualizar', 'error')
      }
    } catch {
      addNotification('Error de conexión', 'error')
    } finally {
      setProcesando(null)
    }
  }

  const aprobarDevolucion = async (id: number) => {
    if (!confirm('¿Aprobar esta devolución?')) return
    setProcesando(String(id))
    try {
      const response = await fetch(`http://localhost:3000/api/devoluciones/${id}/aprobar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comentario: 'Aprobada por Customer Success' })
      })
      if (response.ok) {
        addNotification('Devolución aprobada', 'success')
        cargarDatos()
      } else {
        addNotification('Error al aprobar', 'error')
      }
    } catch {
      addNotification('Error de conexión', 'error')
    } finally {
      setProcesando(null)
    }
  }

  const rechazarDevolucion = async (id: number) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return
    setProcesando(String(id))
    try {
      const response = await fetch(`http://localhost:3000/api/devoluciones/${id}/rechazar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ motivo })
      })
      if (response.ok) {
        addNotification('Devolución rechazada', 'success')
        cargarDatos()
      } else {
        addNotification('Error al rechazar', 'error')
      }
    } catch {
      addNotification('Error de conexión', 'error')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-headset text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Success</h1>
              <p className="text-gray-600">Gestión de pedidos y devoluciones</p>
            </div>
          </div>
          <button onClick={cargarDatos} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
            <i className="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Pedidos Nuevos</p>
            <p className="text-3xl font-bold text-orange-600">{pedidos.length}</p>
            <p className="text-xs text-gray-500 mt-1">esperando confirmación</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Devoluciones</p>
            <p className="text-3xl font-bold text-red-600">{devoluciones.length}</p>
            <p className="text-xs text-gray-500 mt-1">solicitadas</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Valor Pedidos</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(pedidos.reduce((s, p) => s + Number(p.total || 0), 0))}
            </p>
            <p className="text-xs text-gray-500 mt-1">pendientes</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Valor Devoluciones</p>
            <p className="text-2xl font-bold text-red-500">
              {formatPrice(devoluciones.reduce((s, d) => s + Number(d.monto_pedido || 0), 0))}
            </p>
            <p className="text-xs text-gray-500 mt-1">solicitadas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('pedidos')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${tab === 'pedidos' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <i className="fas fa-shopping-bag mr-2"></i>
            Pedidos Nuevos
            {pedidos.length > 0 && <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pedidos.length}</span>}
          </button>
          <button
            onClick={() => setTab('devoluciones')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${tab === 'devoluciones' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <i className="fas fa-undo mr-2"></i>
            Devoluciones
            {devoluciones.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{devoluciones.length}</span>}
          </button>
        </div>

        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : tab === 'pedidos' ? (
          /* ── PEDIDOS NUEVOS ── */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {pedidos.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <i className="fas fa-check-circle text-5xl text-green-300 mb-4"></i>
                <p className="text-lg font-medium">No hay pedidos nuevos</p>
                <p className="text-sm mt-1">Todos los pedidos han sido procesados</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-gray-800">#{pedido.id}</span>
                        <div className="mt-1">
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Creado</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-medium text-gray-800">{pedido.nombre_cliente}</p>
                        <p className="text-gray-500 text-xs">{pedido.email_cliente}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(pedido.productos || []).length} producto(s)
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-700">
                        {formatPrice(pedido.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(pedido.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'Confirmado', 'Confirmado por Customer Success')}
                            disabled={procesando === pedido.id}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <i className="fas fa-check"></i>
                            Confirmar
                          </button>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'Cancelado', 'Cancelado por Customer Success')}
                            disabled={procesando === pedido.id}
                            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50 flex items-center gap-1"
                          >
                            <i className="fas fa-times"></i>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* ── DEVOLUCIONES ── */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {devoluciones.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <i className="fas fa-check-circle text-5xl text-green-300 mb-4"></i>
                <p className="text-lg font-medium">No hay devoluciones pendientes</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {devoluciones.map((dev) => (
                    <tr key={dev.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{dev.id}</td>
                      <td className="px-6 py-4 text-sm font-mono text-xs">{dev.id_pedido}</td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-medium">{dev.nombre_cliente || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">{dev.email_cliente}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dev.razon}</td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600">{formatPrice(dev.monto_pedido)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(dev.fecha_creacion).toLocaleDateString('es-CO')}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => aprobarDevolucion(dev.id)}
                            disabled={procesando === String(dev.id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => rechazarDevolucion(dev.id)}
                            disabled={procesando === String(dev.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
