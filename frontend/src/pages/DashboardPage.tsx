import { useAuthStore } from '@/store/useAuthStore'
import { ROLE_DEFINITIONS } from '@/config/roles'
import RoleGuard from '@/components/auth/RoleGuard'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (!user) return null

  const userRole = ROLE_DEFINITIONS[user.roles[0]]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header del Dashboard */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-12 h-12 ${userRole?.color} rounded-lg flex items-center justify-center`}>
              <i className={`${userRole?.icon} text-white text-xl`}></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {user.name}
              </h1>
              <p className="text-gray-600">{userRole?.name} - {userRole?.description}</p>
            </div>
          </div>
        </div>

        {/* Métricas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <RoleGuard requiredPermissions={['analytics:sales']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventas Hoy</p>
                  <p className="text-2xl font-bold text-green-600">$2,847,392</p>
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
                  <p className="text-2xl font-bold text-blue-600">5,247</p>
                </div>
                <i className="fas fa-box text-blue-500 text-2xl"></i>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['orders:view']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Órdenes Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">127</p>
                </div>
                <i className="fas fa-shopping-cart text-orange-500 text-2xl"></i>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['users:view']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-purple-600">12,847</p>
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
                <Link to="/admin/products" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary transition-colors text-center block">
                  <i className="fas fa-plus mr-2"></i>
                  Crear Producto
                </Link>
                <Link to="/admin/products" className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center block">
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
                <button className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition-colors">
                  <i className="fas fa-percentage mr-2"></i>
                  Nueva Promoción
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-list mr-2"></i>
                  Ver Promociones
                </button>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['analytics:sales']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Analytics</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <i className="fas fa-chart-bar mr-2"></i>
                  Reportes de Ventas
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-download mr-2"></i>
                  Exportar Datos
                </button>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['orders:process']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Órdenes</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <i className="fas fa-truck mr-2"></i>
                  Procesar Envíos
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-undo mr-2"></i>
                  Gestionar Devoluciones
                </button>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['content:edit']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Contenido</h3>
              <div className="space-y-3">
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <i className="fas fa-edit mr-2"></i>
                  Editar Contenido
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-images mr-2"></i>
                  Gestionar Imágenes
                </button>
              </div>
            </div>
          </RoleGuard>

          <RoleGuard requiredPermissions={['users:view']}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Usuarios</h3>
              <div className="space-y-3">
                <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  <i className="fas fa-user-plus mr-2"></i>
                  Crear Usuario
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-users-cog mr-2"></i>
                  Gestionar Roles
                </button>
              </div>
            </div>
          </RoleGuard>
        </div>

        {/* Actividad Reciente */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <i className="fas fa-plus-circle text-green-500"></i>
              <div className="flex-1">
                <p className="text-sm font-medium">Nuevo producto agregado</p>
                <p className="text-xs text-gray-500">Vestido de Verano - Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <i className="fas fa-percentage text-pink-500"></i>
              <div className="flex-1">
                <p className="text-sm font-medium">Promoción activada</p>
                <p className="text-xs text-gray-500">50% OFF en Camisas - Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <i className="fas fa-shopping-cart text-blue-500"></i>
              <div className="flex-1">
                <p className="text-sm font-medium">Orden procesada</p>
                <p className="text-xs text-gray-500">Orden #12847 - Hace 1 hora</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}