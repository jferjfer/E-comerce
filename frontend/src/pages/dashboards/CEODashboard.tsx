import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/services/api'
import { formatPrice } from '@/utils/sanitize'

export default function CEODashboard() {
  const { token } = useAuthStore()
  const [cargando, setCargando] = useState(true)
  const [productos, setProductos] = useState<any[]>([])
  const [pedidos, setPedidos] = useState<any[]>([])
  const [campanas, setCampanas] = useState<any[]>([])
  const [cupones, setCupones] = useState<any[]>([])
  const [devoluciones, setDevoluciones] = useState<any[]>([])
  const [servicios, setServicios] = useState<Record<string, any>>({})

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    setCargando(true)
    try {
      const [resProductos, resPedidos, resCampanas, resCupones, resDevoluciones, resServicios] = await Promise.allSettled([
        api.obtenerProductos(),
        token ? api.obtenerPedidos(token) : Promise.resolve({ pedidos: [] }),
        fetch('http://localhost:3000/api/campanas').then(r => r.json()),
        fetch('http://localhost:3000/api/cupones').then(r => r.json()),
        fetch('http://localhost:3000/api/devoluciones', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('http://localhost:3000/estado-servicios').then(r => r.json())
      ])

      if (resProductos.status === 'fulfilled') setProductos(resProductos.value.productos || [])
      if (resPedidos.status === 'fulfilled') setPedidos((resPedidos.value as any).pedidos || [])
      if (resCampanas.status === 'fulfilled') setCampanas(resCampanas.value.campanas || [])
      if (resCupones.status === 'fulfilled') setCupones(resCupones.value.cupones || [])
      if (resDevoluciones.status === 'fulfilled') setDevoluciones(resDevoluciones.value.devoluciones || [])
      if (resServicios.status === 'fulfilled') setServicios(resServicios.value.servicios || {})
    } catch (e) {
      console.error('Error cargando CEO dashboard:', e)
    } finally {
      setCargando(false)
    }
  }

  const totalVentas = pedidos.reduce((sum: number, p: any) => sum + (Number(p.total) || 0), 0)
  const productosEnStock = productos.filter(p => p.en_stock).length
  const pedidosActivos = pedidos.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Entregado').length
  const devolucionesPendientes = devoluciones.filter(d => d.estado === 'Solicitada').length
  const serviciosActivos = Object.values(servicios).filter((s: any) => s.estado === 'activo').length
  const totalServicios = Object.keys(servicios).length

  const kpis = [
    { label: 'Ingresos Totales', valor: formatPrice(totalVentas), icono: 'fa-dollar-sign', color: 'bg-green-500', sub: `${pedidos.length} pedidos` },
    { label: 'Productos Activos', valor: productosEnStock, icono: 'fa-box', color: 'bg-blue-500', sub: `${productos.length} total` },
    { label: 'Pedidos en Curso', valor: pedidosActivos, icono: 'fa-shopping-cart', color: 'bg-orange-500', sub: `${pedidos.length} total` },
    { label: 'Devoluciones', valor: devolucionesPendientes, icono: 'fa-undo', color: 'bg-red-500', sub: 'pendientes de revisión' },
    { label: 'Campañas Activas', valor: campanas.filter(c => c.estado === 'Activa').length, icono: 'fa-bullhorn', color: 'bg-fuchsia-500', sub: `${campanas.length} total` },
    { label: 'Cupones Activos', valor: cupones.filter(c => c.activo).length, icono: 'fa-ticket-alt', color: 'bg-pink-500', sub: `${cupones.length} total` },
    { label: 'Microservicios', valor: `${serviciosActivos}/${totalServicios}`, icono: 'fa-server', color: serviciosActivos === totalServicios ? 'bg-green-600' : 'bg-yellow-500', sub: 'activos' },
    { label: 'Categorías', valor: [...new Set(productos.map(p => p.categoria))].length, icono: 'fa-tags', color: 'bg-indigo-500', sub: 'en catálogo' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-crown text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
              <p className="text-gray-600">Vista completa del sistema — CEO</p>
            </div>
          </div>
          <button
            onClick={cargarTodo}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <i className="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600">{kpi.label}</p>
                    <div className={`w-9 h-9 ${kpi.color} rounded-lg flex items-center justify-center`}>
                      <i className={`fas ${kpi.icono} text-white text-sm`}></i>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{kpi.valor}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Estado de Microservicios */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-server text-purple-600"></i>
                  Estado de Microservicios
                </h3>
                {Object.keys(servicios).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No se pudo obtener el estado de los servicios</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(servicios).map(([puerto, info]: [string, any]) => (
                      <div key={puerto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${info.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{info.servicio || `Puerto ${puerto}`}</p>
                            <p className="text-xs text-gray-500">{info.url}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${info.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {info.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Últimos Pedidos */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fas fa-shopping-bag text-orange-500"></i>
                    Últimos Pedidos
                  </h3>
                </div>
                {pedidos.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No hay pedidos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {pedidos.slice(0, 6).map((pedido: any) => (
                      <div key={pedido.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-mono font-medium text-gray-800">#{pedido.id}</p>
                          <p className="text-xs text-gray-500">{new Date(pedido.fecha_creacion).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{formatPrice(pedido.total)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            pedido.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                            pedido.estado === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                            pedido.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>{pedido.estado}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Devoluciones Pendientes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-undo text-red-500"></i>
                  Devoluciones Pendientes
                  {devolucionesPendientes > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{devolucionesPendientes}</span>
                  )}
                </h3>
                {devoluciones.filter(d => d.estado === 'Solicitada').length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No hay devoluciones pendientes</p>
                ) : (
                  <div className="space-y-2">
                    {devoluciones.filter(d => d.estado === 'Solicitada').slice(0, 5).map((dev: any) => (
                      <div key={dev.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Pedido #{dev.id_pedido}</p>
                          <p className="text-xs text-gray-500">{dev.razon}</p>
                        </div>
                        <p className="text-sm font-bold text-red-600">{formatPrice(dev.monto_pedido)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campañas de Marketing */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-bullhorn text-fuchsia-500"></i>
                  Campañas de Marketing
                </h3>
                {campanas.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No hay campañas registradas</p>
                ) : (
                  <div className="space-y-2">
                    {campanas.slice(0, 5).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.nombre}</p>
                          <p className="text-xs text-gray-500">{c.tipo} — ${Number(c.presupuesto || 0).toLocaleString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {c.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Accesos Rápidos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to="/products" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <i className="fas fa-box text-blue-600 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-blue-800">Gestión Productos</span>
                </Link>
                <Link to="/marketing" className="flex flex-col items-center p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                  <i className="fas fa-megaphone text-fuchsia-600 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-fuchsia-800">Marketing</span>
                </Link>
                <Link to="/customer-success" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <i className="fas fa-headset text-green-600 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-green-800">Customer Success</span>
                </Link>
                <Link to="/logistics" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <i className="fas fa-truck text-orange-600 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-orange-800">Logística</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
