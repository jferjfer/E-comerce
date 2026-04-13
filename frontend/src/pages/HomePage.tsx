import { API_URL } from '@/config/api';
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import ProductCard from '@/components/ProductCard'
import Modal from '@/components/Modal'
import ARModal from '@/components/ARModal'
import Footer from '@/components/Footer'
import HeroCarousel from '@/components/HeroCarousel'
import { Producto } from '@/types'
import { formatPrice } from '@/utils/sanitize'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function HomePage() {
  const navigate = useNavigate()
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showAR, setShowAR] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [cupones, setCupones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState({
    categoria: '',
    precioMin: '',
    precioMax: '',
    busqueda: '',
    ordenar: 'relevancia'
  })

  // Cargar todos los productos del backend
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true)
        const data = await api.obtenerProductos()
        setProductos(data.productos || [])
      } catch (error) {
        console.error('Error al cargar productos:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarProductos()
  }, [])

  // Cargar cupones activos
  useEffect(() => {
    const cargarCupones = async () => {
      try {
        const res = await fetch(API_URL + '/api/cupones')
        const data = await res.json()
        setCupones(data.cupones?.filter((c: any) => c.activo) || [])
      } catch (error) {
        console.error('Error al cargar cupones:', error)
      }
    }
    cargarCupones()
  }, [])

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    let filtrados = [...productos]

    if (filtros.categoria) {
      filtrados = filtrados.filter(p => p.categoria === filtros.categoria)
    }

    if (filtros.precioMin) {
      filtrados = filtrados.filter(p => p.precio >= parseInt(filtros.precioMin))
    }

    if (filtros.precioMax) {
      filtrados = filtrados.filter(p => p.precio <= parseInt(filtros.precioMax))
    }

    if (filtros.busqueda) {
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase())
      )
    }

    // Ordenar
    if (filtros.ordenar === 'precio_asc') {
      filtrados.sort((a, b) => a.precio - b.precio)
    } else if (filtros.ordenar === 'precio_desc') {
      filtrados.sort((a, b) => b.precio - a.precio)
    } else if (filtros.ordenar === 'nombre') {
      filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre))
    } else if (filtros.ordenar === 'calificacion') {
      filtrados.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0))
    }

    return filtrados
  }, [productos, filtros])

  const limpiarFiltros = () => {
    setFiltros({
      categoria: '',
      precioMin: '',
      precioMax: '',
      busqueda: '',
      ordenar: 'relevancia'
    })
  }

  const manejarVerDetalles = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setShowProductModal(true)
  }

  const cerrarModalProducto = () => {
    setShowProductModal(false)
    // NO limpiar productoSeleccionado aquí para que AR modal pueda usarlo
  }

  const cerrarAR = () => {
    setShowAR(false)
    setProductoSeleccionado(null) // Limpiar después de cerrar AR
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Section con Carrusel */}
      <section className="relative h-52 sm:h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop"
            className="w-full h-full object-cover"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>

        <div className="relative z-10 w-full px-4">
          <HeroCarousel />
        </div>
      </section>

      {/* Barra de Filtros */}
      <section className="sticky top-16 sm:top-20 z-30 bg-white shadow-md border-b">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
          {/* Móvil: fila única con scroll horizontal */}
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide sm:flex-wrap sm:py-3 sm:gap-3">
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="flex-shrink-0 border border-gray-300 rounded-lg px-2 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-gray-400/20 bg-white"
            >
              <option value="">Todas</option>
              <option value="Vestidos">Vestidos</option>
              <option value="Camisas">Camisas</option>
              <option value="Pantalones">Pantalones</option>
              <option value="Blazers">Blazers</option>
              <option value="Calzado">Calzado</option>
            </select>

            <input
              type="text"
              placeholder="Buscar..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              className="flex-shrink-0 border border-gray-300 rounded-lg px-2 py-1.5 text-xs sm:text-sm w-28 sm:w-40 focus:ring-2 focus:ring-gray-400/20"
            />

            <div className="flex-shrink-0 flex gap-1 items-center">
              <input
                type="number"
                placeholder="Mín"
                value={filtros.precioMin}
                onChange={(e) => setFiltros(prev => ({ ...prev, precioMin: e.target.value }))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs w-14 sm:w-20 focus:ring-2 focus:ring-gray-400/20"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Máx"
                value={filtros.precioMax}
                onChange={(e) => setFiltros(prev => ({ ...prev, precioMax: e.target.value }))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs w-14 sm:w-20 focus:ring-2 focus:ring-gray-400/20"
              />
            </div>

            <select
              value={filtros.ordenar}
              onChange={(e) => setFiltros(prev => ({ ...prev, ordenar: e.target.value }))}
              className="flex-shrink-0 border border-gray-300 rounded-lg px-2 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-gray-400/20 bg-white"
            >
              <option value="relevancia">Relevancia</option>
              <option value="precio_asc">Precio ↑</option>
              <option value="precio_desc">Precio ↓</option>
              <option value="nombre">A-Z</option>
              <option value="calificacion">Mejor</option>
            </select>

            <button
              onClick={limpiarFiltros}
              className="flex-shrink-0 text-xs text-gray-500 hover:text-primary px-1.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className="fas fa-times mr-1"></i>
              <span className="hidden sm:inline">Limpiar</span>
            </button>

            <span className="flex-shrink-0 text-xs text-gray-500 font-medium ml-auto">
              {cargando ? '...' : `${productosFiltrados.length} items`}
            </span>
          </div>
        </div>
      </section>

      {/* Grid de Productos */}
      <section className="py-4 sm:py-6 md:py-8 bg-gray-50">
        <div className="w-full px-3 sm:px-4 lg:px-6 2xl:px-10">
          {cargando ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
              {Array.from({ length: 16 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-3 animate-pulse">
                  <div className="bg-gray-200 h-40 sm:h-52 rounded-lg mb-3"></div>
                  <div className="bg-gray-200 h-3 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2 w-3/4"></div>
                  <div className="bg-gray-200 h-7 rounded"></div>
                </div>
              ))}
            </div>
          ) : productosFiltrados.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
              {productosFiltrados.map((producto, index) => (
                <ProductCard
                  key={producto.id || `producto-${index}`}
                  product={producto}
                  onViewDetails={manejarVerDetalles}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 mb-2">No se encontraron productos</p>
              <button
                onClick={limpiarFiltros}
                className="text-primary hover:text-secondary font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      {productoSeleccionado && (
        <Modal
          isOpen={showProductModal}
          onClose={cerrarModalProducto}
          title={productoSeleccionado.nombre}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <img
                src={productoSeleccionado.imagen}
                className="w-full h-auto rounded-lg"
                alt={productoSeleccionado.nombre}
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{productoSeleccionado.descripcion}</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">
                  {formatPrice(productoSeleccionado.precio)}
                </p>
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <button
                    onClick={() => {
                      const agregarItem = useCartStore.getState().agregarItem
                      const addNotification = useNotificationStore.getState().addNotification
                      agregarItem(productoSeleccionado)
                      addNotification(`${productoSeleccionado.nombre} agregado al carrito`, 'success')
                    }}
                    className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg hover:bg-secondary transition-colors text-sm sm:text-base"
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Agregar al Carrito
                  </button>
                  <button
                    onClick={() => {
                      cerrarModalProducto()
                      navigate('/virtual-tryon', { state: { productUrl: productoSeleccionado.imagen } })
                    }}
                    className="w-full bg-gradient-to-r from-gray-800 to-pink-500 text-white py-2.5 sm:py-3 rounded-lg hover:from-gray-800 hover:to-pink-600 transition-colors text-sm sm:text-base"
                  >
                    <i className="fas fa-user-astronaut mr-2"></i>
                    Probar en Avatar 3D
                  </button>
                  {/* Botón AR original (deshabilitado)
                  <button 
                    onClick={() => {
                      cerrarModalProducto()
                      setShowAR(true)
                    }}
                    className="w-full bg-gradient-to-r from-gray-800 to-pink-500 text-white py-2.5 sm:py-3 rounded-lg hover:from-gray-800 hover:to-pink-600 transition-colors text-sm sm:text-base"
                  >
                    <i className="fas fa-camera mr-2"></i>
                    Probar con Cámara AR
                  </button>
                  */}
                </div>
              </div>
              <div className="border-t pt-3 sm:pt-4">
                <h5 className="font-semibold mb-2 text-sm sm:text-base">Características:</h5>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• Material sostenible</li>
                  <li>• Tallas disponibles: {productoSeleccionado.tallas?.join(', ')}</li>
                  <li>• Envío gratuito</li>
                  <li>• Devolución 30 días</li>
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ARModal
        isOpen={showAR && productoSeleccionado !== null}
        onClose={cerrarAR}
        productName={productoSeleccionado?.nombre || ''}
        productImage={productoSeleccionado?.imagen || ''}
      />

      <Footer />
    </div>
  )
}