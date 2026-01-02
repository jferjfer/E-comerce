import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import ProductCard from '@/components/ProductCard'
import Modal from '@/components/Modal'
import ARModal from '@/components/ARModal'
import Footer from '@/components/Footer'
import { Producto } from '@/types'
import { formatPrice } from '@/utils/sanitize'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function CatalogPage() {
  const [filters, setFilters] = useState({
    category: '',
    size: '',
    color: '',
    sortBy: 'relevance'
  })
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false)
  const [mostrarAR, setMostrarAR] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Cargar productos del backend
  useEffect(() => {
    const cargarProductos = async () => {
      setCargando(true)
      try {
        console.log('🔄 Cargando productos del catálogo...')
        const data = await api.obtenerProductos()
        setProductos(data.productos || [])
        console.log(`✅ ${data.productos?.length || 0} productos cargados`)
      } catch (error) {
        console.error('❌ Error al cargar productos:', error)
        setProductos([])
      } finally {
        setCargando(false)
      }
    }
    
    cargarProductos()
  }, [])
  
  const manejarVerDetalles = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setMostrarModalProducto(true)
  }
  
  const cerrarModalProducto = () => {
    setMostrarModalProducto(false)
    setProductoSeleccionado(null)
  }
  
  const productosFiltrados = useMemo(() => {
    let filtrados = [...productos]
    
    if (filters.category) {
      filtrados = filtrados.filter(p => p.categoria === filters.category)
    }
    
    if (filters.sortBy === 'price-low') {
      filtrados.sort((a, b) => a.precio - b.precio)
    } else if (filters.sortBy === 'price-high') {
      filtrados.sort((a, b) => b.precio - a.precio)
    }
    
    return filtrados
  }, [productos, filters])
  
  const clearFilters = () => {
    setFilters({ category: '', size: '', color: '', sortBy: 'relevance' })
  }
  
  return (
    <div className="py-6 sm:py-8 md:py-12 bg-gray-50 min-h-screen">
      <div className="max-w-9xl mx-auto px-3 sm:px-4 lg:px-8 xl:px-12 2xl:px-16">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Filtros:</span>
            <select 
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <option value="">Todas</option>
              <option value="Vestidos">Vestidos</option>
              <option value="Camisas">Camisas</option>
              <option value="Pantalones">Pantalones</option>
              <option value="Blazers">Blazers</option>
            </select>
            
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ml-auto"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-low">Precio ↑</option>
              <option value="price-high">Precio ↓</option>
            </select>
            
            <button 
              onClick={clearFilters}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="text-primary hover:text-secondary text-sm sm:text-base">
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Catálogo</h1>
          </div>
          <span className="text-xs sm:text-sm text-gray-600">
            {cargando ? 'Cargando...' : `${productosFiltrados.length} productos`}
          </span>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
            {productosFiltrados.map((producto, index) => (
              <ProductCard
                key={producto.id || `catalog-producto-${index}`}
                product={producto}
                onViewDetails={manejarVerDetalles}
              />
            ))}
          </div>
        )}
      </div>
      
      {productoSeleccionado && (
        <Modal 
          isOpen={mostrarModalProducto} 
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
                    onClick={() => setMostrarAR(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 sm:py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors text-sm sm:text-base"
                  >
                    <i className="fas fa-camera mr-2"></i>
                    Probar con Cámara AR
                  </button>
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
      
      {productoSeleccionado && (
        <ARModal
          isOpen={mostrarAR}
          onClose={() => setMostrarAR(false)}
          productName={productoSeleccionado.nombre}
          productImage={productoSeleccionado.imagen}
        />
      )}
      
      <Footer />
    </div>
  )
}