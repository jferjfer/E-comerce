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
  const [estadisticas, setEstadisticas] = useState({
    ventasHoy: 0,
    productosActivos: 0,
    ordenesPendientes: 0,
    usuariosActivos: 0
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const [camaraActiva, setCamaraActiva] = useState(false)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar productos
        const { productos: productosData } = await api.obtenerProductos()
        setProductos(productosData)
        
        // Calcular estadísticas reales
        const productosActivos = productosData.filter(p => p.en_stock).length
        const ventasSimuladas = productosData.reduce((total, p) => total + (p.precio * 0.1), 0) // Simular ventas
        
        setEstadisticas({
          ventasHoy: Math.round(ventasSimuladas / 100), // Convertir a pesos
          productosActivos: productosActivos,
          ordenesPendientes: Math.floor(productosActivos * 0.15), // 15% de productos como órdenes
          usuariosActivos: Math.floor(productosActivos * 2.5) // Simular usuarios
        })
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  if (!usuario) return null

  const userRole = ROLE_DEFINITIONS[usuario.rol] || ROLE_DEFINITIONS['cliente']
  const esCliente = usuario.rol === 'cliente'
  const esMarketingManager = usuario.rol === 'marketing_manager'

  // Dashboard específico para Marketing Manager
  if (esMarketingManager) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-fuchsia-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-megaphone text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard de Marketing</h1>
                <p className="text-gray-600">Gestión de Campañas y Promociones</p>
              </div>
            </div>
          </div>

          {/* Métricas de Marketing */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Campañas Activas</p>
                  <p className="text-2xl font-bold text-fuchsia-600">5</p>
                </div>
                <i className="fas fa-bullhorn text-fuchsia-500 text-2xl"></i>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cupones Activos</p>
                  <p className="text-2xl font-bold text-pink-600">12</p>
                </div>
                <i className="fas fa-ticket-alt text-pink-500 text-2xl"></i>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversión</p>
                  <p className="text-2xl font-bold text-green-600">8.5%</p>
                </div>
                <i className="fas fa-chart-line text-green-500 text-2xl"></i>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ROI Marketing</p>
                  <p className="text-2xl font-bold text-blue-600">3.2x</p>
                </div>
                <i className="fas fa-dollar-sign text-blue-500 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-percentage text-pink-600 mr-2"></i>
                Promociones
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition-colors">
                  <i className="fas fa-plus mr-2"></i>
                  Nueva Promoción
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-list mr-2"></i>
                  Ver Todas
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-ticket-alt text-fuchsia-600 mr-2"></i>
                Cupones
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700 transition-colors">
                  <i className="fas fa-plus mr-2"></i>
                  Crear Cupón
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-tags mr-2"></i>
                  Gestionar Cupones
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-chart-bar text-blue-600 mr-2"></i>
                Analytics
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <i className="fas fa-chart-line mr-2"></i>
                  Reportes
                </button>
                <button className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <i className="fas fa-download mr-2"></i>
                  Exportar Datos
                </button>
              </div>
            </div>
          </div>

          {/* Campañas Activas */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Campañas Activas</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-fuchsia-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Black Friday 2024</h4>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Activa</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Descuentos hasta 50% en toda la tienda</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Conversión: <strong className="text-green-600">12.3%</strong></span>
                  <span className="text-gray-500">Ventas: <strong className="text-blue-600">$45,230</strong></span>
                  <button className="text-fuchsia-600 hover:text-fuchsia-700">
                    <i className="fas fa-edit mr-1"></i>Editar
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:border-fuchsia-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Cyber Monday</h4>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Activa</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Ofertas especiales en tecnología</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Conversión: <strong className="text-green-600">9.8%</strong></span>
                  <span className="text-gray-500">Ventas: <strong className="text-blue-600">$32,150</strong></span>
                  <button className="text-fuchsia-600 hover:text-fuchsia-700">
                    <i className="fas fa-edit mr-1"></i>Editar
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:border-fuchsia-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Navidad 2024</h4>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Programada</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Regalos perfectos para esta temporada</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Inicio: <strong>15 Dic 2024</strong></span>
                  <span className="text-gray-500">Fin: <strong>31 Dic 2024</strong></span>
                  <button className="text-fuchsia-600 hover:text-fuchsia-700">
                    <i className="fas fa-edit mr-1"></i>Editar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cupones Populares */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Cupones Más Usados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-pink-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-pink-600">BIENVENIDO20</span>
                  <span className="bg-pink-600 text-white px-2 py-1 rounded text-xs">20%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Descuento para nuevos clientes</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Usos: <strong>234</strong></span>
                  <span>Ahorro: <strong>$12,450</strong></span>
                </div>
              </div>

              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-blue-600">VERANO2024</span>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">15%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Promoción de verano</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Usos: <strong>189</strong></span>
                  <span>Ahorro: <strong>$8,920</strong></span>
                </div>
              </div>

              <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-green-600">ENVIOGRATIS</span>
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">FREE</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Envío gratis en compras +$50</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Usos: <strong>456</strong></span>
                  <span>Ahorro: <strong>$5,680</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard específico para clientes
  if (esCliente) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con hamburger */}


        <div className="max-w-7xl mx-auto">
          {/* Contenido principal */}
          <div className="p-4">
            {/* Stats compactos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pedidos</p>
                    <p className="text-xl font-bold text-gray-900">0</p>
                  </div>
                  <i className="fas fa-box text-blue-500 text-2xl"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-sm p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-100">StylePoints</p>
                    <p className="text-xl font-bold">2,450</p>
                  </div>
                  <i className="fas fa-star text-2xl"></i>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cupones</p>
                    <p className="text-xl font-bold text-green-600">2</p>
                  </div>
                  <i className="fas fa-gift text-green-500 text-2xl"></i>
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
                  className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* Productos Recomendados - Sección principal */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Productos Disponibles</h3>
                <Link to="/catalog" className="text-pink-600 hover:text-pink-700 text-sm font-medium">Ver todo</Link>
              </div>
              
              {cargando ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {productos
                    .filter(producto => !filtroCategoria || producto.categoria.toLowerCase().includes(filtroCategoria.toLowerCase()))
                    .slice(0, 12)
                    .map(producto => (
                    <div key={producto.id} className="group cursor-pointer">
                      <div className="relative overflow-hidden rounded-lg mb-2">
                        <img 
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop'
                          }}
                        />
                        <div className="absolute top-1 right-1">
                          <button className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <i className="fas fa-heart text-gray-400 text-xs"></i>
                          </button>
                        </div>
                        {producto.compatibilidad && (
                          <div className="absolute top-1 left-1">
                            <span className="bg-green-500 text-white px-1 py-0.5 rounded text-xs font-semibold">
                              {producto.compatibilidad}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{producto.nombre}</h4>
                      <p className="text-pink-600 font-semibold text-sm">${(producto.precio / 100).toFixed(2)}</p>
                      
                      <div className="flex space-x-1 mt-2">
                        <button 
                          onClick={() => {
                            setProductoSeleccionado(producto)
                            setMostrarModal(true)
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 py-1 rounded text-xs hover:bg-gray-200 transition-colors"
                        >
                          Ver
                        </button>
                        <button className="flex-1 bg-pink-600 text-white py-1 rounded text-xs hover:bg-pink-700 transition-colors">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Últimas Compras - Compacto */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimas Compras</h3>
              <div className="text-center py-6">
                <i className="fas fa-shopping-bag text-gray-300 text-3xl mb-3"></i>
                <p className="text-gray-500 mb-2">Aún no has realizado compras</p>
                <Link to="/catalog" className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm">
                  Explorar Productos
                </Link>
              </div>
            </div>
          </div>
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
                    <p className="text-3xl font-bold text-pink-600 mb-4">
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
                      <button className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors">
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
    )
  }

  // Dashboard administrativo para otros roles (sin cambios)
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
                  <p className="text-2xl font-bold text-green-600">${estadisticas.ventasHoy.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-blue-600">{estadisticas.productosActivos.toLocaleString()}</p>
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
                  <p className="text-sm text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-purple-600">{estadisticas.usuariosActivos.toLocaleString()}</p>
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
            {productos.slice(0, 3).map((producto, index) => (
              <div key={producto.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <i className={`fas ${index === 0 ? 'fa-plus-circle text-green-500' : index === 1 ? 'fa-percentage text-pink-500' : 'fa-shopping-cart text-blue-500'}`}></i>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {index === 0 ? 'Nuevo producto agregado' : index === 1 ? 'Producto actualizado' : 'Producto en stock'}
                  </p>
                  <p className="text-xs text-gray-500">{producto.nombre} - Hace {index + 1} hora{index > 0 ? 's' : ''}</p>
                </div>
              </div>
            ))}
            {productos.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <i className="fas fa-clock text-2xl mb-2"></i>
                <p>No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}