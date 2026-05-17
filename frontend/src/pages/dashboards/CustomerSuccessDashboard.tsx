import { API_URL } from '@/config/api';
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

interface ModalBonoState {
  abierto: boolean
  emailBusqueda: string
  clienteEncontrado: { id: number; nombre: string; email: string } | null
  buscando: boolean
  creando: boolean
  errorBusqueda: string
  bonoCreado: { codigo: string; monto: number; fecha_vencimiento: string } | null
}

export default function CustomerSuccessDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [tab, setTab] = useState<'pedidos' | 'devoluciones'>('pedidos')
  const [paginaPedidos, setPaginaPedidos] = useState(1)
  const [paginaDevoluciones, setPaginaDevoluciones] = useState(1)
  const POR_PAGINA = 8
  const { token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const socket = useSocket()

  const [bono, setBono] = useState<ModalBonoState>({
    abierto: false,
    emailBusqueda: '',
    clienteEncontrado: null,
    buscando: false,
    creando: false,
    errorBusqueda: '',
    bonoCreado: null
  })

  const resetBono = () => setBono({
    abierto: false, emailBusqueda: '', clienteEncontrado: null,
    buscando: false, creando: false, errorBusqueda: '', bonoCreado: null
  })

  const buscarCliente = async () => {
    if (!bono.emailBusqueda.trim()) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bono.emailBusqueda.trim())) {
      setBono(b => ({ ...b, errorBusqueda: 'Ingresa un email válido' }))
      return
    }
    setBono(b => ({ ...b, buscando: true, errorBusqueda: '', clienteEncontrado: null }))
    try {
      // Buscar en la lista de clientes del auth-service
      const res = await fetch(`${API_URL}/api/usuarios/todos/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const cliente = (data.usuarios || []).find(
        (u: any) => u.email.toLowerCase() === bono.emailBusqueda.trim().toLowerCase()
      )
      if (!cliente) {
        setBono(b => ({ ...b, buscando: false, errorBusqueda: 'No se encontró ningún cliente con ese email' }))
        return
      }
      setBono(b => ({ ...b, buscando: false, clienteEncontrado: { id: cliente.id, nombre: cliente.nombre, email: cliente.email } }))
    } catch {
      setBono(b => ({ ...b, buscando: false, errorBusqueda: 'Error de conexión al buscar cliente' }))
    }
  }

  const crearBono = async () => {
    if (!bono.clienteEncontrado) return
    setBono(b => ({ ...b, creando: true }))
    try {
      const res = await fetch(`${API_URL}/api/bonos/generar-manual/${bono.clienteEncontrado.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setBono(b => ({ ...b, creando: false, errorBusqueda: data.detail || 'Error al crear el bono' }))
        return
      }
      setBono(b => ({ ...b, creando: false, bonoCreado: data }))
      addNotification(`Bono ${data.codigo} creado para ${bono.clienteEncontrado!.nombre}`, 'success')
    } catch {
      setBono(b => ({ ...b, creando: false, errorBusqueda: 'Error de conexión al crear bono' }))
    }
  }

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [resPedidos, resDevoluciones] = await Promise.all([
        fetch(API_URL + '/api/admin/pedidos?estado=Creado', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(API_URL + '/api/devoluciones?estado=Solicitada', {
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
      const response = await fetch(`${API_URL}/api/pedidos/${pedidoId}/estado`, {
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
      const response = await fetch(`${API_URL}/api/devoluciones/${id}/aprobar`, {
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
      const response = await fetch(`${API_URL}/api/devoluciones/${id}/rechazar`, {
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
      <div className="max-w-screen-2xl mx-auto px-4 py-8">

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
          <div className="flex gap-3">
            <button
              onClick={() => setBono(b => ({ ...b, abierto: true }))}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors font-semibold"
            >
              <i className="fas fa-gift"></i>
              Crear Bono
            </button>
            <button onClick={cargarDatos} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
              <i className="fas fa-sync-alt"></i>
              Actualizar
            </button>
          </div>
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {pedidos.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <i className="fas fa-check-circle text-5xl text-green-300 mb-4"></i>
                <p className="text-lg font-medium">No hay pedidos nuevos</p>
                <p className="text-sm mt-1">Todos los pedidos han sido procesados</p>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pedidos.slice((paginaPedidos-1)*POR_PAGINA, paginaPedidos*POR_PAGINA).map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-100/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-gray-800">#{pedido.id}</span>
                          <div className="mt-1"><span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Creado</span></div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="font-medium text-gray-800">{pedido.nombre_cliente}</p>
                          <p className="text-gray-500 text-xs">{pedido.email_cliente}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{(pedido.productos || []).length} producto(s)</td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-700">{formatPrice(pedido.total)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(pedido.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => cambiarEstadoPedido(pedido.id, 'Cancelado', 'Cancelado por Customer Success')} disabled={procesando === pedido.id} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50 flex items-center gap-1">
                              <i className="fas fa-times"></i> Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Paginación */}
                {pedidos.length > POR_PAGINA && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Mostrando {Math.min((paginaPedidos-1)*POR_PAGINA+1, pedidos.length)}–{Math.min(paginaPedidos*POR_PAGINA, pedidos.length)} de {pedidos.length}</p>
                    <div className="flex gap-1">
                      <button onClick={() => setPaginaPedidos(p => Math.max(1, p-1))} disabled={paginaPedidos === 1} className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white"><i className="fas fa-chevron-left"></i></button>
                      <button onClick={() => setPaginaPedidos(p => Math.min(Math.ceil(pedidos.length/POR_PAGINA), p+1))} disabled={paginaPedidos >= Math.ceil(pedidos.length/POR_PAGINA)} className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white"><i className="fas fa-chevron-right"></i></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ── DEVOLUCIONES ── */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {devoluciones.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <i className="fas fa-check-circle text-5xl text-green-300 mb-4"></i>
                <p className="text-lg font-medium">No hay devoluciones pendientes</p>
              </div>
            ) : (
              <>
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
                    {devoluciones.slice((paginaDevoluciones-1)*POR_PAGINA, paginaDevoluciones*POR_PAGINA).map((dev) => (
                      <tr key={dev.id} className="hover:bg-gray-100/30 transition-colors">
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
                            <button onClick={() => aprobarDevolucion(dev.id)} disabled={procesando === String(dev.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">Aprobar</button>
                            <button onClick={() => rechazarDevolucion(dev.id)} disabled={procesando === String(dev.id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">Rechazar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {devoluciones.length > POR_PAGINA && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Mostrando {Math.min((paginaDevoluciones-1)*POR_PAGINA+1, devoluciones.length)}–{Math.min(paginaDevoluciones*POR_PAGINA, devoluciones.length)} de {devoluciones.length}</p>
                    <div className="flex gap-1">
                      <button onClick={() => setPaginaDevoluciones(p => Math.max(1, p-1))} disabled={paginaDevoluciones === 1} className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white"><i className="fas fa-chevron-left"></i></button>
                      <button onClick={() => setPaginaDevoluciones(p => Math.min(Math.ceil(devoluciones.length/POR_PAGINA), p+1))} disabled={paginaDevoluciones >= Math.ceil(devoluciones.length/POR_PAGINA)} className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white"><i className="fas fa-chevron-right"></i></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL CREAR BONO ── */}
      {bono.abierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-gift text-amber-600"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Crear Bono de Compensación</h2>
                  <p className="text-xs text-gray-500">$100.000 COP — válido 30 días</p>
                </div>
              </div>
              <button onClick={resetBono} className="text-gray-400 hover:text-gray-600 text-xl">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Si ya se creó el bono — mostrar resultado */}
              {bono.bonoCreado ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <i className="fas fa-check text-green-600 text-2xl"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">¡Bono creado exitosamente!</p>
                    <p className="text-sm text-gray-500 mt-1">Se envió un correo a <strong>{bono.clienteEncontrado?.email}</strong></p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <p className="text-xs text-amber-400 tracking-widest mb-1">CÓDIGO DE BONO</p>
                    <p className="text-2xl font-bold text-white font-mono tracking-widest">{bono.bonoCreado.codigo}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Vence: {new Date(bono.bonoCreado.fecha_vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={resetBono} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700">
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  {/* Paso 1: buscar cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email del cliente
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={bono.emailBusqueda}
                        onChange={e => setBono(b => ({ ...b, emailBusqueda: e.target.value, errorBusqueda: '', clienteEncontrado: null }))}
                        onKeyDown={e => e.key === 'Enter' && buscarCliente()}
                        placeholder="cliente@ejemplo.com"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        disabled={bono.buscando}
                      />
                      <button
                        onClick={buscarCliente}
                        disabled={bono.buscando || !bono.emailBusqueda.trim()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {bono.buscando
                          ? <i className="fas fa-spinner fa-spin"></i>
                          : <i className="fas fa-search"></i>
                        }
                        Buscar
                      </button>
                    </div>
                    {bono.errorBusqueda && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {bono.errorBusqueda}
                      </p>
                    )}
                  </div>

                  {/* Paso 2: cliente encontrado */}
                  {bono.clienteEncontrado && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {bono.clienteEncontrado.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{bono.clienteEncontrado.nombre}</p>
                          <p className="text-xs text-gray-500">{bono.clienteEncontrado.email}</p>
                          <p className="text-xs text-gray-400">ID: {bono.clienteEncontrado.id}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-amber-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monto del bono</span>
                          <span className="font-bold text-amber-600">$100.000 COP</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Validez</span>
                          <span className="text-gray-700">30 días</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Notificación</span>
                          <span className="text-gray-700">Correo automático</span>
                        </div>
                      </div>

                      <button
                        onClick={crearBono}
                        disabled={bono.creando}
                        className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {bono.creando
                          ? <><i className="fas fa-spinner fa-spin"></i> Creando bono...</>
                          : <><i className="fas fa-gift"></i> Confirmar y crear bono</>
                        }
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
