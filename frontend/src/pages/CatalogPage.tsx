import { useState, useMemo, useEffect } from 'react'
import { productosSimulados } from '@/data/products'
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
        const data = await api.obtenerProductos()
        if (data.productos && data.productos.length > 0) {
          // Combinar productos del backend con los simulados
          setProductos([...productosSimulados, ...data.productos])
        } else {
          // Usar solo productos simulados si no hay datos del backend
          setProductos(productosSimulados)
        }
      } catch (error) {
        console.error('Error al cargar productos:', error)
        setProductos(productosSimulados)
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
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
            <select 
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas las categorías</option>
              <option value="Vestidos">Vestidos</option>
              <option value="Camisas">Camisas</option>
              <option value="Pantalones">Pantalones</option>
              <option value="Blazers">Blazers</option>
            </select>
            
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm ml-auto"
            >
              <option value="relevance">Ordenar por: Relevancia</option>
              <option value="price-low">Precio: Menor a mayor</option>
              <option value="price-high">Precio: Mayor a menor</option>
            </select>
            
            <button 
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Catálogo</h1>
          <span className="text-sm text-gray-600">
            {cargando ? 'Cargando...' : `${productosFiltrados.length} productos encontrados`}
          </span>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productosFiltrados.map((producto) => (
              <ProductCard
                key={producto.id}
                product={producto}
                onViewDetails={manejarVerDetalles}
              />
            ))}
          </div>
        )}
      </div>
      
      {selectedProduct && (
        <Modal 
          isOpen={showProductModal} 
          onClose={closeProductModal}
          title={selectedProduct.name}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={selectedProduct.image} 
                className="w-full h-auto rounded-lg" 
                alt={selectedProduct.name}
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
                <p className="text-3xl font-bold text-primary mb-6">
                  {formatPrice(selectedProduct.price)}
                </p>
                <div className="space-y-3 mb-6">
                  <button 
                    onClick={() => {
                      const addItem = useCartStore.getState().addItem
                      const addNotification = useNotificationStore.getState().addNotification
                      addItem(selectedProduct)
                      addNotification(`${selectedProduct.name} agregado al carrito`, 'success')
                    }}
                    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Agregar al Carrito
                  </button>
                  <button 
                    onClick={() => setShowAR(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                  >
                    <i className="fas fa-camera mr-2"></i>
                    Probar con Cámara AR
                  </button>
                </div>
              </div>
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-2">Características:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Material sostenible</li>
                  <li>• Tallas disponibles: {selectedProduct.size?.join(', ')}</li>
                  <li>• Envío gratuito</li>
                  <li>• Devolución 30 días</li>
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      )}
      
      {selectedProduct && (
        <ARModal
          isOpen={showAR}
          onClose={() => setShowAR(false)}
          productName={selectedProduct.name}
          productImage={selectedProduct.image}
        />
      )}
      
      <Footer />
    </div>
  )
}