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
  fecha_actualizacion: string
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
  fecha_actualizacion: string
  monto_pedido: number
  nombre_cliente: string
  email_cliente: string
}

const BADGE: Record<string, string> = {
  Confirmado: 'bg-blue-100 text-blue-800',
  Enviado: 'bg-gray-100 text-gray-700',
  Entregado: 'bg-green-100 text-green-800',
  Cancelado: 'bg-red-100 text-red-800',
}

export default function LogisticsCoordinatorDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [tab, setTab] = useState<'confirmados' | 'enviados' | 'devoluciones'>('confirmados')
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 8
  const { token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const socket = useSocket()

  const cargarDatos = async () => {
    setCargando(true)
    try {
      // Cargar pedidos confirmados Y enviados en paralelo
      const [resConfirmados, resEnviados, resDevoluciones] = await Promise.all([
        fetch('http://localhost:3000/api/admin/pedidos?estado=Confirmado', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),
        fetch('http://localhost:3000/api/admin/pedidos?estado=Enviado', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),
        fetch('http://localhost:3000/api/devoluciones?estado=Aprobada', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())
      ])

      const confirmados = (resConfirmados.pedidos || []).map((p: Pedido) => ({ ...p, estado: 'Confirmado' }))
      const enviados = (resEnviados.pedidos || []).map((p: Pedido) => ({ ...p, estado: 'Enviado' }))
      setPedidos([...confirmados, ...enviados])
      setDevoluciones(resDevoluciones.devoluciones || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  // Tiempo real: pedido confirmado llega a logística
  useEffect(() => {
    const recargar = () => cargarDatos()
    socket.on('pedido_actualizado', recargar)
    return () => { socket.off('pedido_actualizado', recargar) }
  }, [socket])

  const cambiarEstado = async (pedidoId: string, nuevoEstado: string, comentario: string) => {
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

  const completarDevolucion = async (id: number) => {
    if (!confirm('¿Marcar esta devolución como completada?')) return
    setProcesando(String(id))
    try {
      const response = await fetch(`http://localhost:3000/api/devoluciones/${id}/completar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comentario: 'Producto recibido y procesado por Logística' })
      })
      if (response.ok) {
        addNotification('Devolución completada', 'success')
        cargarDatos()
      } else {
        addNotification('Error al completar', 'error')
      }
    } catch {
      addNotification('Error de conexión', 'error')
    } finally {
      setProcesando(null)
    }
  }

  const confirmados = pedidos.filter(p => p.estado === 'Confirmado')
  const enviados = pedidos.filter(p => p.estado === 'Enviado')
  const tabActual = tab === 'confirmados' ? confirmados : tab === 'enviados' ? enviados : []
  const paginados = tabActual.slice((pagina-1)*POR_PAGINA, pagina*POR_PAGINA)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-truck text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coordinación Logística</h1>
              <p className="text-gray-600">Despacho de pedidos y devoluciones</p>
            </div>
          </div>
          <button onClick={cargarDatos} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
            <i className="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Para Despachar</p>
            <p className="text-3xl font-bold text-blue-600">{confirmados.length}</p>
            <p className="text-xs text-gray-500 mt-1">pedidos confirmados</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-gray-200">
            <p className="text-sm text-gray-600">En Tránsito</p>
            <p className="text-3xl font-bold text-gray-700">{enviados.length}</p>
            <p className="text-xs text-gray-500 mt-1">pedidos enviados</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Devoluciones</p>
            <p className="text-3xl font-bold text-red-600">{devoluciones.length}</p>
            <p className="text-xs text-gray-500 mt-1">aprobadas pendientes</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Valor en Tránsito</p>
            <p className="text-xl font-bold text-green-600">
              {formatPrice(enviados.reduce((s, p) => s + Number(p.total || 0), 0))}
            </p>
            <p className="text-xs text-gray-500 mt-1">enviados</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setTab('confirmados')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${tab === 'confirmados' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <i className="fas fa-box mr-2"></i>
            Para Despachar
            {confirmados.length > 0 && <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{confirmados.length}</span>}
          </button>
          <button
            onClick={() => setTab('enviados')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${tab === 'enviados' ? 'bg-gray-100 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <i className="fas fa-shipping-fast mr-2"></i>
            En Tránsito
            {enviados.length > 0 && <span className="ml-2 bg-gray-100 text-white text-xs px-2 py-0.5 rounded-full">{enviados.length}</span>}
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          </div>
        ) : tab !== 'devoluciones' ? (
          /* ── PEDIDOS ── */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {tabActual.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <i className="fas fa-check-circle text-5xl text-green-300 mb-4"></i>
                <p className="text-lg font-medium">
                  {tab === 'confirmados' ? 'No hay pedidos para despachar' : 'No hay pedidos en tránsito'}
                </p>
              </div>
            ) : (
              <>
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginados.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-100/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-gray-800">#{pedido.id}</span>
                          <div className="mt-1"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[pedido.estado] || 'bg-gray-100 text-gray-700'}`}>{pedido.estado}</span></div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="font-medium text-gray-800">{pedido.nombre_cliente}</p>
                          <p className="text-gray-500 text-xs">{pedido.email_cliente}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{(pedido.productos || []).length} producto(s)</td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-700">{formatPrice(pedido.total)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(pedido.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4">
                          {pedido.estado === 'Confirmado' && (
                            <button onClick={() => cambiarEstado(pedido.id, 'Enviado', 'Despachado por Logística')} disabled={procesando === pedido.id} className="bg-gray-100 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2">
                              <i className="fas fa-shipping-fast"></i> Marcar Enviado
                            </button>
                          )}
                          {pedido.estado === 'Enviado' && (
                            <button onClick={() => cambiarEstado(pedido.id, 'Entregado', 'Entregado al cliente')} disabled={procesando === pedido.id} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                              <i className="fas fa-check-circle"></i> Marcar Entregado
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tabActual.length > POR_PAGINA && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Mostrando {Math.min((pagina-1)*POR_PAGINA+1, tabActual.length)}–{Math.min(pagina*POR_PAGINA, tabActual.length)} de {tabActual.length}</p>
                    <div className="flex gap-1">
                      <button onClick={() => setPagina(p => Math.max(1, p-1))} disabled={pagina === 1} className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white"><i className="fas fa-chevron-left"></i></button>
                      <button onClick={() => setPagina(p => Math.min(Math.ceil(tabActual.length/POR_PAGINA), p+1))} disabled={pagina >= Math.ceil(tabActual.length/POR_PAGINA)} className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white"><i className="fas fa-chevron-right"></i></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ── DEVOLUCIONES APROBADAS ── */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {devoluciones.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <i className="fas fa-check-circle text-5xl text-green-300 mb-4"></i>
                <p className="text-lg font-medium">No hay devoluciones aprobadas pendientes</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprobada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(dev.fecha_actualizacion).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => completarDevolucion(dev.id)}
                          disabled={procesando === String(dev.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <i className="fas fa-box-open"></i>
                          Completar
                        </button>
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
