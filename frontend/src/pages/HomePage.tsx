import { useState, useEffect } from 'react'
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

export default function HomePage() {
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showAR, setShowAR] = useState(false)
  const [productosDestacados, setProductosDestacados] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Cargar productos destacados del backend
  useEffect(() => {
    const cargarProductosDestacados = async () => {
      try {
        setCargando(true)
        const { productos } = await api.obtenerProductosDestacados()
        setProductosDestacados(productos)
      } catch (error) {
        console.error('Error al cargar productos destacados:', error)
      } finally {
        setCargando(false)
      }
    }
    
    cargarProductosDestacados()
  }, [])
  
  const manejarVerDetalles = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setShowProductModal(true)
  }
  
  const cerrarModalProducto = () => {
    setShowProductModal(false)
    setProductoSeleccionado(null)
  }
  
  return (
    <div className="bg-gray-50">
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop" 
            className="w-full h-full object-cover"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-primary/70"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h2 className="text-5xl font-serif font-bold mb-4 leading-tight">
            Moda Inteligente
            <span className="block text-white">
              Personalizada
            </span>
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Descubre tu estilo único con Estilo y Moda. Moda para todos sin límites.
          </p>
          <div className="flex justify-center space-x-6">
            <Link 
              to="/profile"
              className="bg-white text-primary px-10 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <i className="fas fa-user mr-2"></i>
              Configurar IA
            </Link>
            <Link 
              to="/catalog"
              className="bg-transparent text-white px-10 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors border border-white"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-sans font-bold text-primary mb-3">
                <i className="fas fa-star text-accent mr-2"></i>
                Recomendado para Ti
              </h2>
              <p className="text-lg text-gray-600">Selección personalizada por IA</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>IA activa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cargando ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-6 rounded mb-2 w-3/4"></div>
                  <div className="bg-gray-300 h-8 rounded"></div>
                </div>
              ))
            ) : productosDestacados.length > 0 ? (
              productosDestacados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  product={producto}
                  onViewDetails={manejarVerDetalles}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <i className="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600">No hay productos destacados disponibles</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {productoSeleccionado && (
        <Modal 
          isOpen={showProductModal} 
          onClose={cerrarModalProducto}
          title={productoSeleccionado.nombre}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={productoSeleccionado.imagen} 
                className="w-full h-auto rounded-lg" 
                alt={productoSeleccionado.nombre}
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-4">{productoSeleccionado.descripcion}</p>
                <p className="text-3xl font-bold text-primary mb-6">
                  {formatPrice(productoSeleccionado.precio)}
                </p>
                <div className="space-y-3 mb-6">
                  <button 
                    onClick={() => {
                      const agregarItem = useCartStore.getState().agregarItem
                      const addNotification = useNotificationStore.getState().addNotification
                      agregarItem(productoSeleccionado)
                      addNotification(`${productoSeleccionado.nombre} agregado al carrito`, 'success')
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
          isOpen={showAR}
          onClose={() => setShowAR(false)}
          productName={productoSeleccionado.nombre}
          productImage={productoSeleccionado.imagen}
        />
      )}
      
      <Footer />
    </div>
  )
}