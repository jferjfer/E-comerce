import { useState } from 'react'
import { Producto } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatPrice } from '@/utils/sanitize'
import ARModal from './ARModal'
import PromoBadge from './promotions/PromoBadge'
import PriceDisplay from './promotions/PriceDisplay'

interface PropsTarjetaProducto {
  product: Producto
  onViewDetails: (producto: Producto) => void
}

export default function ProductCard({ product: producto, onViewDetails }: PropsTarjetaProducto) {
  const [showAR, setShowAR] = useState(false)
  const agregarItem = useCartStore(state => state.agregarItem)
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserStore()
  const addNotification = useNotificationStore(state => state.addNotification)
  
  const manejarAgregarCarrito = () => {
    agregarItem(producto)
    addNotification(`${producto.nombre} agregado al carrito`, 'success')
  }
  
  const manejarToggleFavorito = () => {
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id)
      addNotification('Eliminado de favoritos', 'info')
    } else {
      addToFavorites(producto.id)
      addNotification('Agregado a favoritos', 'success')
    }
  }
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i 
        key={i} 
        className={`fas fa-star ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }
  
  return (
    <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      <div className="relative">
        <img 
          src={producto.imagen}
          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
          alt={producto.nombre}
          loading="lazy"
        />
        
        <div className="absolute top-4 left-4 space-y-2">
          {producto.es_eco && (
            <PromoBadge text="ECO" type="new" size="sm" />
          )}
          {Math.random() > 0.7 && (
            <PromoBadge text="50% OFF" type="sale" size="sm" animated />
          )}
          {Math.random() > 0.8 && (
            <PromoBadge text="NUEVO" type="new" size="sm" />
          )}
          {Math.random() > 0.9 && (
            <PromoBadge text="ÚLTIMAS UNIDADES" type="limited" size="sm" />
          )}
        </div>
        
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={manejarToggleFavorito}
            className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white"
          >
            <i className={`${isFavorite(producto.id) ? 'fas text-red-500' : 'far text-gray-600'} fa-heart`}></i>
          </button>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
          <div className="flex space-x-2">
            <button 
              onClick={manejarAgregarCarrito}
              className="flex-1 bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary/80 text-sm"
            >
              <i className="fas fa-shopping-cart mr-1"></i>
              Agregar
            </button>
            <button 
              onClick={() => onViewDetails(producto)}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-xl"
              title="Ver detalles"
            >
              <i className="fas fa-eye text-primary"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-sage font-semibold uppercase tracking-wide">
            {producto.categoria}
          </span>
          <div className="flex text-sm">
            {renderStars(producto.calificacion)}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{producto.nombre}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{producto.descripcion}</p>
        
        <div className="flex items-center justify-between">
          <PriceDisplay 
            originalPrice={producto.precio}
            discount={Math.random() > 0.6 ? Math.floor(Math.random() * 50) + 10 : undefined}
            size="sm"
          />
          {producto.compatibilidad && (
            <div className="text-right">
              <div className="text-xs text-primary font-semibold">Compatibilidad IA</div>
              <div className="text-sm font-bold text-primary">{producto.compatibilidad}%</div>
            </div>
          )}
        </div>
      </div>
      
      <ARModal
        isOpen={showAR}
        onClose={() => setShowAR(false)}
        productName={producto.nombre}
        productImage={producto.imagen}
      />
    </div>
  )
}