import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import { formatPrice } from '@/utils/sanitize'

export default function CustomerDashboard() {
  const { usuario, token } = useAuthStore()
  const totalItems = useCartStore(state => state.obtenerTotalItems())
  const { favorites } = useUserStore()
  const [pedidos, setPedidos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!token) return
    api.obtenerPedidos(token).then(r => {
      setPedidos((r.pedidos || []).slice(0, 3))
    }).catch(() => {}).finally(() => setCargando(false))
  }, [token])

  const getEstadoColor = (estado: string) => {
    const m: Record<string, string> = {
      Entregado: 'bg-emerald-100 text-emerald-800',
      Confirmado: 'bg-blue-100 text-blue-800',
      'En Camino': 'bg-purple-100 text-purple-800',
      Alistado: 'bg-amber-100 text-amber-800',
      Cancelado: 'bg-red-100 text-red-800',
      Creado: 'bg-gray-100 text-gray-700',
    }
    return m[estado] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-8">

        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {usuario?.nombre?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Bienvenido a tu panel personal</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'En carrito', valor: totalItems, icono: 'fa-shopping-cart', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pedidos', valor: pedidos.length, icono: 'fa-shopping-bag', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Favoritos', valor: favorites.length, icono: 'fa-heart', color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Productos vistos', valor: '—', icono: 'fa-eye', color: 'text-gray-600', bg: 'bg-gray-100' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>
                <i className={`fas ${k.icono} ${k.color}`}></i>
              </div>
              <p className="text-2xl font-bold text-gray-900">{k.valor}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Últimos pedidos reales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Últimos pedidos</h3>
              <Link to="/orders" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Ver todos →
              </Link>
            </div>
            {cargando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : pedidos.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-shopping-bag text-3xl text-gray-200 mb-3"></i>
                <p className="text-gray-400 text-sm">Aún no tienes pedidos</p>
                <Link to="/catalog" className="mt-3 inline-block text-xs font-semibold text-gray-700 hover:text-gray-900 underline">
                  Ir al catálogo
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidos.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-mono font-semibold text-gray-800">#{String(p.id).slice(0, 12)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(p.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoColor(p.estado)}`}>
                        {p.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accesos rápidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Accesos rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: '/catalog', icono: 'fa-search', label: 'Explorar', color: 'text-blue-600', bg: 'bg-blue-50' },
                { to: '/orders', icono: 'fa-shopping-bag', label: 'Mis Pedidos', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { to: '/favorites', icono: 'fa-heart', label: 'Favoritos', color: 'text-red-500', bg: 'bg-red-50' },
                { to: '/profile', icono: 'fa-user-circle', label: 'Mi Perfil', color: 'text-gray-600', bg: 'bg-gray-100' },
                { to: '/credit', icono: 'fa-credit-card', label: 'Crédito EGOS', color: 'text-amber-600', bg: 'bg-amber-50' },
                { to: '/style-analysis', icono: 'fa-magic', label: 'Mi Estilo', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${item.icono} ${item.color} text-sm`}></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
