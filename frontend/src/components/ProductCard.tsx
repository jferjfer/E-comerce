import { useState } from 'react'
import { Producto } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
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
  const agregarItem = useCartStore(state => state.agregarItem)
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserStore()
  const { usuario } = useAuthStore()
  const addNotification = useNotificationStore(state => state.addNotification)
  
  const esCliente = usuario?.rol === 'cliente'
  
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
        key={`star-${producto.id}-${i}`} 
        className={`fas fa-star text-xs ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen del producto */}
      <div className="relative">
        <img 
          src={producto.imagen}
          alt={producto.nombre}
          className="w-full h-40 sm:h-48 md:h-56 object-cover"
          loading="lazy"
        />
        
        {/* Botón favorito */}
        <button 
          onClick={manejarToggleFavorito}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <i className={`${isFavorite(producto.id) ? 'fas text-red-500' : 'far text-gray-600'} fa-heart text-xs sm:text-sm`}></i>
        </button>
        
        {/* Badge ECO */}
        {producto.es_eco && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold">
            ECO
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-2.5 sm:p-3 md:p-4 flex flex-col gap-1.5 sm:gap-2">
        {/* Categoría y calificación */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium">
            {producto.categoria}
          </span>
          <div className="flex gap-0.5">
            {renderStars(producto.calificacion)}
          </div>
        </div>

        {/* Nombre */}
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 line-clamp-2">{producto.nombre}</h3>

        {/* Descripción */}
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 hidden sm:block">{producto.descripcion}</p>

        {/* Precio y compatibilidad */}
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
            {formatPrice(producto.precio)}
          </span>
          {producto.compatibilidad && (
            <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold">
              {producto.compatibilidad}% IA
            </span>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-1.5 sm:gap-2 mt-1 sm:mt-2">
          <button 
            onClick={manejarAgregarCarrito}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-primary text-white py-1.5 sm:py-2 px-2 sm:px-4 rounded hover:bg-secondary transition-colors font-medium text-xs sm:text-sm"
          >
            <i className="fas fa-shopping-cart text-xs sm:text-sm"></i>
            <span className="hidden sm:inline">Agregar</span>
            <span className="sm:hidden">+</span>
          </button>
          <button 
            onClick={() => onViewDetails(producto)}
            className="bg-gray-100 text-gray-700 p-1.5 sm:p-2 rounded hover:bg-gray-200 transition-colors"
            title="Ver detalles"
          >
            <i className="fas fa-eye text-xs sm:text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  )
}