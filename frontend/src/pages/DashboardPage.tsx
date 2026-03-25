import { useAuthStore } from '@/store/useAuthStore'
import { ROLE_DEFINITIONS } from '@/config/roles'
import RoleGuard from '@/components/auth/RoleGuard'
import { Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { Producto } from '@/types'
import { formatPrice } from '@/utils/sanitize'

export default function DashboardPage() {
  const { usuario, token } = useAuthStore()
  const [productos, setProductos] = useState<Producto[]>([])
  const [estadisticas, setEstadisticas] = useState({
    ventasHoy: 0,
    productosActivos: 0,
    ordenesPendientes: 0,
    usuariosActivos: 0
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { productos: productosData } = await api.obtenerProductos()
        setProductos(productosData)

        const productosActivos = productosData.filter((p: Producto) => p.en_stock).length
        const totalVentas = productosData.reduce((sum: number, p: Producto) => sum + p.precio, 0)

        let ordenesPendientes = 0
        if (token) {
          try {
            const resPedidos = await api.obtenerPedidos(token)
            ordenesPendientes = (resPedidos.pedidos || []).filter(
              (p: any) => p.estado !== 'Entregado' && p.estado !== 'Cancelado'
            ).length
          } catch {}
        }

        setEstadisticas({
          ventasHoy: Math.round(totalVentas / 100),
          productosActivos,
          ordenesPendientes,
          usuariosActivos: productosActivos
        })
      } catch (error) {
        console.error('Error cargando datos:', error)
      }
    }

    cargarDatos()
  }, [token])

  if (!usuario) return null

  // Marketing Manager → su propio dashboard
  if (usuario.rol === 'marketing_manager') {
    return <Navigate to="/marketing" replace />
  }

  // Customer Success → su propio dashboard
  if (usuario.rol === 'customer_success') {
    return <Navigate to="/customer-success" replace />
  }

  // Logistics Coordinator → su propio dashboard
  if (usuario.rol === 'logistics_coordinator') {
    return <Navigate to="/logistics" replace />
  }

  // CEO → su propio dashboard
  if (usuario.rol === 'ceo') {
    return <Navigate to="/" replace />
  }

  const userRole = ROLE_DEFINITIONS[usuario.rol] || ROLE_DEFINITIONS['cliente']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-12 h-12 ${userRole?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
              <i className={`${userRole?.icon || 'fas fa-user'} text-white text-xl`}></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {usuario.nombre}
              </h1>
              <p className="text-gray-600">{userRole?.name} — {userRole?.description}</p>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <RoleGuard requiredPermissions={['analytics:sales']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(estadisticas.ventasHoy)}</p>
                </div>
                <i className="fas fa-chart-line text-green-500 text-2xl"></i>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['products:read']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Productos Activos</p>
                  <p className="text-2xl font-bold text-blue-600">{estadisticas.productosActivos}</p>
                </div>
                <i className="fas fa-box text-blue-500 text-2xl"></i>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['orders:view']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Órdenes en Curso</p>
                  <p className="text-2xl font-bold text-orange-600">{estadisticas.ordenesPendientes}</p>
                </div>
                <i className="fas fa-shopping-cart text-orange-500 text-2xl"></i>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['users:view']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Productos en Catálogo</p>
                  <p className="text-2xl font-bold text-purple-600">{productos.length}</p>
                </div>
                <i className="fas fa-users text-purple-500 text-2xl"></i>
              </div>
            </div>
          </RoleGuard>
        </div>

        {/* Acciones Rápidas por Rol */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RoleGuard requiredPermissions={['products:create']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Gestión de Productos</h3>
              <div className="space-y-3">
                <Link to="/products/crear" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary transition-colors text-center block">
                  <i className="fas fa-plus mr-2"></i>
                  Crear Producto
                </Link>
                <Link to="/products" className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <i className="fas fa-edit mr-2"></i>
                  Gestionar Productos
                </Link>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['promotions:create']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Promociones</h3>
              <div className="space-y-3">
                <Link to="/marketing" className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition-colors text-center block">
                  <i className="fas fa-percentage mr-2"></i>
                  Nueva Promoción
                </Link>
                <Link to="/marketing" className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <i className="fas fa-list mr-2"></i>
                  Ver Promociones
                </Link>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['analytics:sales']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Analytics</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const datos = { productos, estadisticas, fecha: new Date().toISOString() }
                    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `reporte-${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.json`
                    a.click()
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <i className="fas fa-download mr-2"></i>
                  Exportar Reporte
                </button>
                <Link to="/admin" className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <i className="fas fa-chart-bar mr-2"></i>
                  Ver Dashboard
                </Link>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['orders:process']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Órdenes y Devoluciones</h3>
              <div className="space-y-3">
                <Link to="/logistics" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-center block">
                  <i className="fas fa-truck mr-2"></i>
                  Logística
                </Link>
                <Link to="/customer-success" className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <i className="fas fa-undo mr-2"></i>
                  Devoluciones
                </Link>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['content:edit']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Contenido</h3>
              <div className="space-y-3">
                <Link to="/products" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-center block">
                  <i className="fas fa-edit mr-2"></i>
                  Editar Productos
                </Link>
                <Link to="/products/crear" className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <i className="fas fa-images mr-2"></i>
                  Subir Imágenes
                </Link>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['users:view']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Mi Cuenta</h3>
              <div className="space-y-3">
                <Link to="/profile" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-center block">
                  <i className="fas fa-user mr-2"></i>
                  Mi Perfil
                </Link>
                <Link to="/" className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block">
                  <i className="fas fa-home mr-2"></i>
                  Ir al Inicio
                </Link>
              </div>
            </div>
          </RoleGuard>
        </div>

        {/* Productos recientes */}
        {productos.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Productos del Catálogo</h3>
              <Link to="/products" className="text-primary hover:text-secondary text-sm font-medium">
                Ver todos ({productos.length})
              </Link>
            </div>
            <div className="space-y-3">
              {productos.slice(0, 5).map((producto) => (
                <div key={producto.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-12 h-12 object-cover rounded-lg"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">{producto.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatPrice(producto.precio)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${producto.en_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {producto.en_stock ? 'En Stock' : 'Agotado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
