import { useAuthStore } from '@/store/useAuthStore'
import { ROLE_DEFINITIONS } from '@/config/roles'
import RoleGuard from '@/components/auth/RoleGuard'
import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { Producto } from '@/types'

export default function DashboardPage() {
  const { usuario } = useAuthStore()
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mostrarChat, setMostrarChat] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [camaraActiva, setCamaraActiva] = useState(false)

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const { productos: productosData } = await api.obtenerProductos()
        setProductos(productosData)
      } catch (error) {
        console.error('Error cargando productos:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarProductos()
  }, [])

  if (!usuario) return null

  const userRole = ROLE_DEFINITIONS[usuario.rol] || ROLE_DEFINITIONS['cliente']
  const esCliente = usuario.rol === 'cliente'

  // Dashboard para clientes - Catálogo de productos
  if (esCliente) {
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
                  Bienvenido, {usuario.nombre}
                </h1>
                <p className="text-gray-600">{userRole?.name} - {userRole?.description}</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold text-gray-900">Filtros:</h3>
              <select 
                value={filtroCategoria} 
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todas las categorías</option>
                <option value="vestidos">Vestidos</option>
                <option value="camisas">Camisas</option>
                <option value="pantalones">Pantalones</option>
                <option value="blazers">Blazers</option>
                <option value="accesorios">Accesorios</option>
              </select>
              <button 
                onClick={() => setFiltroCategoria('')}
                className="text-primary hover:text-secondary text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Catálogo de Productos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
              <Link to="/catalog" className="text-primary hover:text-secondary">
                Ver catálogo completo
              </Link>
            </div>
            
            {cargando ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="w-full h-64 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {productos
                  .filter(producto => !filtroCategoria || producto.categoria.toLowerCase().includes(filtroCategoria.toLowerCase()))
                  .map(producto => (
                  <div key={producto.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop'
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors">
                          <i className="fas fa-heart text-gray-400 hover:text-red-500"></i>
                        </button>
                      </div>
                      {producto.compatibilidad && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {producto.compatibilidad}% Match
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{producto.nombre}</h3>
                      <p className="text-gray-600 text-sm mb-2">{producto.categoria}</p>
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-primary">
                          ${(producto.precio / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setProductoSeleccionado(producto)
                            setMostrarModal(true)
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          Ver
                        </button>
                        <button className="flex-1 bg-primary text-white px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
                          <i className="fas fa-shopping-cart mr-1"></i>
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón flotante de IA Chat */}
          <button 
            onClick={() => setMostrarChat(!mostrarChat)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
          >
            <i className="fas fa-robot text-xl"></i>
          </button>

          {/* Chat de IA */}
          {mostrarChat && (
            <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border z-50">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Asesor de IA</h3>
                  <button onClick={() => setMostrarChat(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <div className="p-4 h-64 overflow-y-auto">
                <div className="bg-gray-100 rounded-lg p-3 mb-3">
                  <p className="text-sm">¡Hola! Soy tu asesor de moda con IA. ¿En qué puedo ayudarte hoy?</p>
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de producto */}
          {mostrarModal && productoSeleccionado && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{productoSeleccionado.nombre}</h2>
                    <button 
                      onClick={() => setMostrarModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="fas fa-times text-xl"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img 
                        src={productoSeleccionado.imagen}
                        alt={productoSeleccionado.nombre}
                        className="w-full h-80 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop'
                        }}
                      />
                    </div>
                    
                    <div>
                      <p className="text-gray-600 mb-2">{productoSeleccionado.categoria}</p>
                      <p className="text-3xl font-bold text-primary mb-4">
                        ${(productoSeleccionado.precio / 100).toFixed(2)}
                      </p>
                      
                      {productoSeleccionado.compatibilidad && (
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg mb-4">
                          <i className="fas fa-check-circle mr-2"></i>
                          {productoSeleccionado.compatibilidad}% Compatible con tu estilo
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <h3 className="font-semibold mb-2">Descripción</h3>
                        <p className="text-gray-600">
                          {productoSeleccionado.descripcion || 'Prenda de alta calidad perfecta para cualquier ocasión. Diseño moderno y cómodo que se adapta a tu estilo personal.'}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <button className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors">
                          <i className="fas fa-shopping-cart mr-2"></i>
                          Agregar al Carrito
                        </button>
                        <button 
                          onClick={() => {
                            setCamaraActiva(true)
                            navigator.mediaDevices.getUserMedia({ video: true })
                              .then(stream => {
                                if (videoRef.current) {
                                  videoRef.current.srcObject = stream
                                }
                              })
                              .catch(err => console.error('Error accediendo a la cámara:', err))
                          }}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                        >
                          <i className="fas fa-camera mr-2"></i>
                          Pruébatelo
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cámara */}
                  {camaraActiva && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Prueba Virtual</h3>
                        <button 
                          onClick={() => {
                            setCamaraActiva(false)
                            if (videoRef.current && videoRef.current.srcObject) {
                              const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
                              tracks.forEach(track => track.stop())
                            }
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline
                        className="w-full h-64 bg-black rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Dashboard administrativo para otros roles
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
                Bienvenido, {usuario.nombre}
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