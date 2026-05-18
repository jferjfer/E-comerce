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

interface ClienteBusqueda {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  ciudad: string
  documento_tipo: string
  documento_numero: string
  total_compras_historico: number
  activo: boolean
  fecha_creacion: string
}

interface Trazabilidad {
  perfil: any
  auditoria: any[]
  intentos_login: any[]
  pedidos: any[]
  devoluciones: any[]
  bonos: any[]
  resumen: {
    total_pedidos: number
    total_devoluciones: number
    total_bonos: number
    bonos_disponibles: number
    ultimo_login: string | null
  }
}

interface ModalBonoState {
  abierto: boolean
  documentoBusqueda: string
  montoBono: number
  clienteEncontrado: { id: number; nombre: string; email: string; documento: string } | null
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
  const [tab, setTab] = useState<'pedidos' | 'devoluciones' | 'clientes'>('pedidos')
  const [paginaPedidos, setPaginaPedidos] = useState(1)
  const [paginaDevoluciones, setPaginaDevoluciones] = useState(1)
  const POR_PAGINA = 8
  const { token } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const socket = useSocket()

  // ── Estado búsqueda de clientes ──
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [resultadosClientes, setResultadosClientes] = useState<ClienteBusqueda[]>([])
  const [errorBusquedaCliente, setErrorBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Trazabilidad | null>(null)
  const [cargandoTrazabilidad, setCargandoTrazabilidad] = useState(false)
  const [tabTrazabilidad, setTabTrazabilidad] = useState<'resumen' | 'pedidos' | 'devoluciones' | 'bonos' | 'auditoria'>('resumen')

  // ── Lista completa de clientes con paginación ──
  const [todosClientes, setTodosClientes] = useState<ClienteBusqueda[]>([])
  const [cargandoClientes, setCargandoClientes] = useState(false)
  const [paginaClientes, setPaginaClientes] = useState(1)
  const [totalClientesPaginas, setTotalClientesPaginas] = useState(1)
  const [totalClientesCount, setTotalClientesCount] = useState(0)
  const CLIENTES_POR_PAGINA = 15

  const [bono, setBono] = useState<ModalBonoState>({
    abierto: false,
    documentoBusqueda: '',
    montoBono: 100000,
    clienteEncontrado: null,
    buscando: false,
    creando: false,
    errorBusqueda: '',
    bonoCreado: null
  })

  const resetBono = () => setBono({
    abierto: false, documentoBusqueda: '', montoBono: 100000, clienteEncontrado: null,
    buscando: false, creando: false, errorBusqueda: '', bonoCreado: null
  })

  // ── Buscar clientes ──
  const buscarClientes = async () => {
    if (!busquedaCliente.trim() || busquedaCliente.trim().length < 2) {
      setErrorBusquedaCliente('Ingresa al menos 2 caracteres')
      return
    }
    setBuscandoCliente(true)
    setErrorBusquedaCliente('')
    setResultadosClientes([])
    setClienteSeleccionado(null)
    try {
      const res = await fetch(`${API_URL}/api/usuarios/buscar/clientes?q=${encodeURIComponent(busquedaCliente.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) { setErrorBusquedaCliente(data.error || 'Error buscando'); return }
      if (data.clientes.length === 0) { setErrorBusquedaCliente('No se encontraron clientes con ese email o documento') }
      setResultadosClientes(data.clientes || [])
    } catch {
      setErrorBusquedaCliente('Error de conexión')
    } finally {
      setBuscandoCliente(false)
    }
  }

  const verTrazabilidad = async (clienteId: number) => {
    setCargandoTrazabilidad(true)
    setClienteSeleccionado(null)
    try {
      const res = await fetch(`${API_URL}/api/usuarios/cliente/${clienteId}/trazabilidad`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) { addNotification(data.error || 'Error obteniendo trazabilidad', 'error'); return }
      setClienteSeleccionado(data)
      setTabTrazabilidad('resumen')
    } catch {
      addNotification('Error de conexión', 'error')
    } finally {
      setCargandoTrazabilidad(false)
    }
  }

  const cargarTodosClientes = async (pagina = 1, buscar = '') => {
    setCargandoClientes(true)
    try {
      const params = new URLSearchParams({ pagina: String(pagina), limite: String(CLIENTES_POR_PAGINA) })
      if (buscar.trim()) params.append('buscar', buscar.trim())
      const res = await fetch(`${API_URL}/api/usuarios/todos/clientes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTodosClientes(data.usuarios || [])
      setTotalClientesPaginas(data.total_paginas || 1)
      setTotalClientesCount(data.total || 0)
      setPaginaClientes(pagina)
    } catch {
      addNotification('Error cargando clientes', 'error')
    } finally {
      setCargandoClientes(false)
    }
  }

  const buscarCliente = async () => {
    if (!bono.documentoBusqueda.trim() || bono.documentoBusqueda.trim().length < 5) {
      setBono(b => ({ ...b, errorBusqueda: 'Ingresa un número de documento válido (mínimo 5 dígitos)' }))
      return
    }
    if (!/^[0-9]{5,12}$/.test(bono.documentoBusqueda.trim())) {
      setBono(b => ({ ...b, errorBusqueda: 'El documento debe tener entre 5 y 12 dígitos numéricos' }))
      return
    }
    if (bono.montoBono < 10000 || bono.montoBono > 200000) {
      setBono(b => ({ ...b, errorBusqueda: 'El monto debe estar entre $10.000 y $200.000' }))
      return
    }
    setBono(b => ({ ...b, buscando: true, errorBusqueda: '', clienteEncontrado: null }))
    try {
      const res = await fetch(`${API_URL}/api/usuarios/buscar/clientes?q=${encodeURIComponent(bono.documentoBusqueda.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const cliente = (data.clientes || [])[0]
      if (!cliente) {
        setBono(b => ({ ...b, buscando: false, errorBusqueda: 'No se encontró ningún cliente con ese número de documento' }))
        return
      }
      setBono(b => ({ ...b, buscando: false, clienteEncontrado: { id: cliente.id, nombre: cliente.nombre, email: cliente.email, documento: `${cliente.documento_tipo}: ${cliente.documento_numero}` } }))
    } catch {
      setBono(b => ({ ...b, buscando: false, errorBusqueda: 'Error de conexión al buscar cliente' }))
    }
  }

  const crearBono = async () => {
    if (!bono.clienteEncontrado) return
    if (bono.montoBono < 10000 || bono.montoBono > 200000) {
      setBono(b => ({ ...b, errorBusqueda: 'El monto debe estar entre $10.000 y $200.000' }))
      return
    }
    setBono(b => ({ ...b, creando: true }))
    try {
      const res = await fetch(`${API_URL}/api/bonos/generar-manual/${bono.clienteEncontrado.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monto: bono.montoBono })
      })
      const data = await res.json()
      if (!res.ok) {
        setBono(b => ({ ...b, creando: false, errorBusqueda: data.detail || 'Error al crear el bono' }))
        return
      }
      setBono(b => ({ ...b, creando: false, bonoCreado: data }))
      addNotification(`Bono ${data.codigo} de ${formatPrice(bono.montoBono)} creado para ${bono.clienteEncontrado!.nombre}`, 'success')
    } catch {
      setBono(b => ({ ...b, creando: false, errorBusqueda: 'Error de conexión al crear bono' }))
    }
  }

  const [pedidoDetalle, setPedidoDetalle] = useState<any | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const verDetallePedido = async (pedido: Pedido) => {
    setCargandoDetalle(true)
    setPedidoDetalle(null)
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${pedido.id}/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const historial = res.ok ? await res.json() : { historial: [] }
      setPedidoDetalle({ ...pedido, historial: historial.historial || [] })
    } catch {
      setPedidoDetalle({ ...pedido, historial: [] })
    } finally {
      setCargandoDetalle(false)
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
          <button
            onClick={() => { setTab('clientes'); setClienteSeleccionado(null); setResultadosClientes([]); setBusquedaCliente(''); setErrorBusquedaCliente(''); cargarTodosClientes(1) }}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${tab === 'clientes' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <i className="fas fa-user-circle mr-2"></i>
            Consultar Cliente
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
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Pedido</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Productos</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Fecha</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pedidos.slice((paginaPedidos-1)*POR_PAGINA, paginaPedidos*POR_PAGINA).map((pedido) => {
                        const nombreCompleto = pedido.nombre_cliente || ''
                        const partes = nombreCompleto.trim().split(' ')
                        const primerNombre = partes[0] || ''
                        const primerApellido = partes[1] || ''
                        return (
                          <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono text-xs font-bold text-gray-800">#{pedido.id}</span>
                              <div className="mt-1 flex justify-center">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Creado</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <p className="text-sm font-semibold text-gray-800">{primerNombre} {primerApellido}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <p className="text-xs text-gray-500">{pedido.email_cliente || 'N/A'}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-600">{(pedido.productos || []).length}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-bold text-emerald-700">{formatPrice(pedido.total)}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs text-gray-500">{new Date(pedido.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => verDetallePedido(pedido)}
                                  className="bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-200 flex items-center gap-1 font-medium"
                                >
                                  <i className="fas fa-eye"></i> Ver
                                </button>
                                <button
                                  onClick={() => cambiarEstadoPedido(pedido.id, 'Cancelado', 'Cancelado por Customer Success')}
                                  disabled={procesando === pedido.id}
                                  className="bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-200 disabled:opacity-50 flex items-center gap-1 font-medium"
                                >
                                  <i className="fas fa-times"></i> Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
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
        ) : tab === 'clientes' ? (
          /* ── CONSULTAR CLIENTE ── */
          <div className="space-y-6">
            {!clienteSeleccionado && (
              <div className="space-y-4">
                {/* Buscador */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex gap-3">
                    <input type="text" value={busquedaCliente}
                      onChange={e => setBusquedaCliente(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (busquedaCliente.trim().length >= 2) buscarClientes()
                          else cargarTodosClientes(1)
                        }
                      }}
                      placeholder="Buscar por email o documento..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button onClick={() => busquedaCliente.trim().length >= 2 ? buscarClientes() : cargarTodosClientes(1)}
                      disabled={buscandoCliente || cargandoClientes}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                      {(buscandoCliente || cargandoClientes) ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                      Buscar
                    </button>
                    {busquedaCliente && (
                      <button onClick={() => { setBusquedaCliente(''); setResultadosClientes([]); setErrorBusquedaCliente(''); cargarTodosClientes(1) }}
                        className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-200">
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  {errorBusquedaCliente && <p className="text-red-500 text-sm mt-2"><i className="fas fa-exclamation-circle mr-1"></i>{errorBusquedaCliente}</p>}
                </div>

                {/* Lista de clientes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {resultadosClientes.length > 0
                        ? `${resultadosClientes.length} resultado(s) de búsqueda`
                        : `${totalClientesCount} clientes registrados`
                      }
                    </p>
                    <p className="text-xs text-gray-400">Haz clic en un cliente para ver su trazabilidad completa</p>
                  </div>

                  {cargandoClientes ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
                      <table className="min-w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Documento</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ciudad</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total compras</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Miembro desde</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(resultadosClientes.length > 0 ? resultadosClientes : todosClientes).map(c => (
                            <tr key={c.id}
                              onClick={() => verTrazabilidad(c.id)}
                              className="hover:bg-blue-50 cursor-pointer transition-colors group">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-sm">{c.nombre.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{c.nombre} {c.apellido}</p>
                                    <p className="text-xs text-gray-500">{c.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-600">{c.documento_tipo} {c.documento_numero || '—'}</td>
                              <td className="px-5 py-3 text-sm text-gray-600">{c.ciudad || '—'}</td>
                              <td className="px-5 py-3 text-right text-sm font-bold text-emerald-700">{formatPrice(c.total_compras_historico)}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {c.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center text-xs text-gray-500">
                                {new Date(c.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Paginación — solo cuando no hay búsqueda activa */}
                      {resultadosClientes.length === 0 && totalClientesPaginas > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                          <p className="text-xs text-gray-500">
                            Página {paginaClientes} de {totalClientesPaginas} — {totalClientesCount} clientes
                          </p>
                          <div className="flex gap-1">
                            <button onClick={() => cargarTodosClientes(paginaClientes - 1)} disabled={paginaClientes === 1}
                              className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white">
                              <i className="fas fa-chevron-left"></i>
                            </button>
                            {Array.from({ length: Math.min(5, totalClientesPaginas) }, (_, i) => {
                              const p = Math.max(1, paginaClientes - 2) + i
                              if (p > totalClientesPaginas) return null
                              return (
                                <button key={p} onClick={() => cargarTodosClientes(p)}
                                  className={`px-3 py-1 text-xs rounded-lg border ${ p === paginaClientes ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-white' }`}>
                                  {p}
                                </button>
                              )
                            })}
                            <button onClick={() => cargarTodosClientes(paginaClientes + 1)} disabled={paginaClientes >= totalClientesPaginas}
                              className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 hover:bg-white">
                              <i className="fas fa-chevron-right"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {cargandoTrazabilidad && (
                  <div className="flex items-center justify-center py-8 gap-3 bg-white rounded-xl border">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-500 text-sm">Cargando trazabilidad completa...</span>
                  </div>
                )}
              </div>
            )}

            {clienteSeleccionado && (
              <div className="space-y-4">
                {/* Header cliente */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{clienteSeleccionado.perfil.nombre.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{clienteSeleccionado.perfil.nombre} {clienteSeleccionado.perfil.apellido}</h2>
                        <p className="text-gray-500 text-sm">{clienteSeleccionado.perfil.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{clienteSeleccionado.perfil.documento_tipo}: {clienteSeleccionado.perfil.documento_numero}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{clienteSeleccionado.perfil.ciudad}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${clienteSeleccionado.perfil.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{clienteSeleccionado.perfil.activo ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setClienteSeleccionado(null)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
                  </div>
                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
                    {[
                      { label: 'Total compras', valor: formatPrice(clienteSeleccionado.perfil.total_compras_historico), color: 'emerald' },
                      { label: 'Pedidos', valor: clienteSeleccionado.resumen.total_pedidos, color: 'blue' },
                      { label: 'Devoluciones', valor: clienteSeleccionado.resumen.total_devoluciones, color: 'red' },
                      { label: 'Bonos activos', valor: clienteSeleccionado.resumen.bonos_disponibles, color: 'amber' },
                      { label: 'Último login', valor: clienteSeleccionado.resumen.ultimo_login ? new Date(clienteSeleccionado.resumen.ultimo_login).toLocaleDateString('es-CO') : 'Nunca', color: 'gray' },
                    ].map(k => (
                      <div key={k.label} className={`bg-${k.color}-50 rounded-lg p-3 text-center`}>
                        <p className={`text-lg font-bold text-${k.color}-700`}>{k.valor}</p>
                        <p className="text-xs text-gray-500">{k.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-tabs trazabilidad */}
                <div className="flex gap-2 flex-wrap">
                  {(['resumen','pedidos','devoluciones','bonos','auditoria'] as const).map(t => (
                    <button key={t} onClick={() => setTabTrazabilidad(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ tabTrazabilidad === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border' }`}>
                      {t === 'resumen' && <i className="fas fa-user mr-1"></i>}
                      {t === 'pedidos' && <i className="fas fa-shopping-bag mr-1"></i>}
                      {t === 'devoluciones' && <i className="fas fa-undo mr-1"></i>}
                      {t === 'bonos' && <i className="fas fa-gift mr-1"></i>}
                      {t === 'auditoria' && <i className="fas fa-history mr-1"></i>}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                  {tabTrazabilidad === 'resumen' && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Datos personales</h3>
                        <dl className="space-y-2 text-sm">
                          {[
                            ['Teléfono', clienteSeleccionado.perfil.telefono || '—'],
                            ['Género', clienteSeleccionado.perfil.genero || '—'],
                            ['Fecha nacimiento', clienteSeleccionado.perfil.fecha_nacimiento || '—'],
                            ['Dirección', clienteSeleccionado.perfil.direccion || '—'],
                            ['Ciudad', clienteSeleccionado.perfil.ciudad || '—'],
                            ['Departamento', clienteSeleccionado.perfil.departamento || '—'],
                            ['Acepta marketing', clienteSeleccionado.perfil.acepta_marketing ? 'Sí' : 'No'],
                            ['Miembro desde', new Date(clienteSeleccionado.perfil.fecha_creacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                              <dt className="text-gray-500">{k}</dt>
                              <dd className="font-medium text-gray-800">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Intentos de login recientes</h3>
                        <div className="space-y-1">
                          {clienteSeleccionado.intentos_login.length === 0
                            ? <p className="text-gray-400 text-sm">Sin intentos registrados</p>
                            : clienteSeleccionado.intentos_login.slice(0, 8).map((i: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                                <span className={`px-2 py-0.5 rounded-full font-medium ${i.exitoso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{i.exitoso ? '✓ Exitoso' : '✗ Fallido'}</span>
                                <span className="text-gray-400">{i.ip_address}</span>
                                <span className="text-gray-500">{new Date(i.fecha).toLocaleString('es-CO')}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {tabTrazabilidad === 'pedidos' && (
                    <div className="overflow-x-auto">
                      {clienteSeleccionado.pedidos.length === 0 ? <p className="text-center py-10 text-gray-400">Sin pedidos</p> : (
                        <table className="min-w-full">
                          <thead className="bg-gray-50"><tr>{['Pedido','Estado','Total','Productos','Fecha'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-gray-100">
                            {clienteSeleccionado.pedidos.map((p: any) => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 font-mono text-sm font-semibold">#{p.id}</td>
                                <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${ p.estado === 'Entregado' ? 'bg-green-100 text-green-700' : p.estado === 'Cancelado' ? 'bg-red-100 text-red-700' : p.estado === 'En Camino' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700' }`}>{p.estado}</span></td>
                                <td className="px-5 py-3 font-bold text-emerald-700 text-sm">{formatPrice(p.total)}</td>
                                <td className="px-5 py-3 text-sm text-gray-500">{(p.productos || []).length} item(s)</td>
                                <td className="px-5 py-3 text-sm text-gray-500">{new Date(p.fecha_creacion).toLocaleDateString('es-CO')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {tabTrazabilidad === 'devoluciones' && (
                    <div className="overflow-x-auto">
                      {clienteSeleccionado.devoluciones.length === 0 ? <p className="text-center py-10 text-gray-400">Sin devoluciones</p> : (
                        <table className="min-w-full">
                          <thead className="bg-gray-50"><tr>{['Pedido','Razón','Estado','Monto','Fecha'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-gray-100">
                            {clienteSeleccionado.devoluciones.map((d: any) => (
                              <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 font-mono text-sm">{d.id_pedido}</td>
                                <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{d.razon}</td>
                                <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${ d.estado === 'Completada' ? 'bg-green-100 text-green-700' : d.estado === 'Rechazada' ? 'bg-red-100 text-red-700' : d.estado === 'Aprobada' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700' }`}>{d.estado}</span></td>
                                <td className="px-5 py-3 font-bold text-red-600 text-sm">{formatPrice(d.monto_pedido)}</td>
                                <td className="px-5 py-3 text-sm text-gray-500">{new Date(d.fecha_creacion).toLocaleDateString('es-CO')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {tabTrazabilidad === 'bonos' && (
                    <div className="p-6">
                      {clienteSeleccionado.bonos.length === 0 ? <p className="text-center py-6 text-gray-400">Sin bonos</p> : (
                        <div className="space-y-3">
                          {clienteSeleccionado.bonos.map((b: any) => (
                            <div key={b.codigo} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                              <div>
                                <p className="font-mono font-bold text-gray-900 tracking-widest">{b.codigo}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Generado: {new Date(b.fecha_generacion).toLocaleDateString('es-CO')} • Vence: {new Date(b.fecha_vencimiento).toLocaleDateString('es-CO')}</p>
                                {b.fecha_uso && <p className="text-xs text-gray-400">Usado: {new Date(b.fecha_uso).toLocaleDateString('es-CO')}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-amber-600">{formatPrice(b.monto)}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${ b.estado === 'Disponible' ? 'bg-green-100 text-green-700' : b.estado === 'Usado' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600' }`}>{b.estado}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tabTrazabilidad === 'auditoria' && (
                    <div className="overflow-x-auto">
                      {clienteSeleccionado.auditoria.length === 0 ? <p className="text-center py-10 text-gray-400">Sin registros</p> : (
                        <table className="min-w-full">
                          <thead className="bg-gray-50"><tr>{['Acción','Detalle','IP','Fecha'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-gray-100">
                            {clienteSeleccionado.auditoria.map((a: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-5 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{a.accion}</span></td>
                                <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{a.entidad_afectada}</td>
                                <td className="px-5 py-3 text-xs text-gray-400 font-mono">{a.ip_address || '—'}</td>
                                <td className="px-5 py-3 text-xs text-gray-500">{new Date(a.fecha_hora).toLocaleString('es-CO')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Botón crear bono desde trazabilidad */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setBono(b => ({ ...b, abierto: true, documentoBusqueda: clienteSeleccionado.perfil.documento_numero || '', clienteEncontrado: { id: clienteSeleccionado.perfil.id, nombre: clienteSeleccionado.perfil.nombre, email: clienteSeleccionado.perfil.email, documento: `${clienteSeleccionado.perfil.documento_tipo}: ${clienteSeleccionado.perfil.documento_numero}` } }))}
                    className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                  >
                    <i className="fas fa-gift"></i>
                    Crear bono de compensación para este cliente
                  </button>
                </div>
              </div>
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

      {/* ── MODAL DETALLE PEDIDO ── */}
      {pedidoDetalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pedido <span className="font-mono text-blue-600">#{pedidoDetalle.id}</span></h2>
                <p className="text-xs text-gray-500">{pedidoDetalle.nombre_cliente} • {pedidoDetalle.email_cliente}</p>
              </div>
              <button onClick={() => setPedidoDetalle(null)} className="text-gray-400 hover:text-gray-600 text-xl"><i className="fas fa-times"></i></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info general */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className="text-sm font-bold text-blue-700">{pedidoDetalle.estado}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-sm font-bold text-emerald-700">{formatPrice(pedidoDetalle.total)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="text-xs font-medium text-gray-700">{new Date(pedidoDetalle.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Productos del pedido</h3>
                {(pedidoDetalle.productos || []).length === 0
                  ? <p className="text-gray-400 text-sm">Sin detalle de productos</p>
                  : <div className="space-y-2">
                    {(pedidoDetalle.productos || []).map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 border">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.nombre || `Producto #${p.id}`}</p>
                          <p className="text-xs text-gray-500">Cantidad: {p.cantidad} • {formatPrice(p.precio_unitario || p.precio)} c/u</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-700">{formatPrice(p.subtotal || (p.precio_unitario || p.precio) * p.cantidad)}</p>
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Historial de estados */}
              {pedidoDetalle.historial?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Historial de estados</h3>
                  <div className="space-y-1">
                    {pedidoDetalle.historial.map((h: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 w-4">{i + 1}</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{h.estado_anterior || 'Inicio'}</span>
                        <i className="fas fa-arrow-right text-gray-300"></i>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{h.estado_nuevo}</span>
                        <span className="text-gray-400 ml-auto">{new Date(h.fecha_cambio).toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gestionar estado */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Gestionar pedido</h3>
                <div className="flex flex-wrap gap-2">
                  {['Confirmado','Alistado','En Camino','Entregado','Cancelado'].map(estado => (
                    <button
                      key={estado}
                      onClick={async () => {
                        await cambiarEstadoPedido(pedidoDetalle.id, estado, `Cambiado a ${estado} por Customer Success`)
                        setPedidoDetalle(null)
                      }}
                      disabled={procesando === pedidoDetalle.id || pedidoDetalle.estado === estado}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors ${
                        estado === 'Cancelado' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        estado === 'Confirmado' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                        estado === 'Entregado' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {pedidoDetalle.estado === estado ? <><i className="fas fa-check mr-1"></i>{estado}</> : estado}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-gray-500">Máximo $200.000 COP — válido 30 días</p>
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
                  {/* Paso 1: buscar cliente por documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de documento del cliente
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bono.documentoBusqueda}
                        onChange={e => setBono(b => ({ ...b, documentoBusqueda: e.target.value.replace(/\D/g, ''), errorBusqueda: '', clienteEncontrado: null }))}
                        onKeyDown={e => e.key === 'Enter' && buscarCliente()}
                        placeholder="Ej: 1234567890"
                        maxLength={12}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        disabled={bono.buscando}
                      />
                      <button
                        onClick={buscarCliente}
                        disabled={bono.buscando || bono.documentoBusqueda.trim().length < 5}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {bono.buscando ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
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

                  {/* Monto del bono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto del bono: <span className="text-amber-600 font-bold">{formatPrice(bono.montoBono)}</span>
                    </label>
                    <input
                      type="range"
                      min={10000}
                      max={200000}
                      step={10000}
                      value={bono.montoBono}
                      onChange={e => setBono(b => ({ ...b, montoBono: Number(e.target.value) }))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>$10.000</span>
                      <span>$200.000</span>
                    </div>
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
                          <p className="text-xs text-gray-400">{bono.clienteEncontrado.documento}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-amber-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monto del bono</span>
                          <span className="font-bold text-amber-600">{formatPrice(bono.montoBono)}</span>
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
