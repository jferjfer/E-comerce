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
    if (!esCliente) {
      addNotification('Solo los clientes pueden agregar productos al carrito', 'error')
      return
    }
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
          className="w-full h-56 object-cover"
          loading="lazy"
        />
        
        {/* Botón favorito */}
        <button 
          onClick={manejarToggleFavorito}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <i className={`${isFavorite(producto.id) ? 'fas text-red-500' : 'far text-gray-600'} fa-heart text-sm`}></i>
        </button>
        
        {/* Badge ECO */}
        {producto.es_eco && (
          <span className="absolute top-3 left-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
            ECO
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-2">
        {/* Categoría y calificación */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {producto.categoria}
          </span>
          <div className="flex gap-0.5">
            {renderStars(producto.calificacion)}
          </div>
        </div>

        {/* Nombre */}
        <h3 className="text-lg font-semibold text-gray-800">{producto.nombre}</h3>

        {/* Descripción */}
        <p className="text-sm text-gray-600 line-clamp-2">{producto.descripcion}</p>

        {/* Precio y compatibilidad */}
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-xl font-bold text-primary">
            {formatPrice(producto.precio)}
          </span>
          {producto.compatibilidad && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold">
              {producto.compatibilidad}% IA
            </span>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-2">
          {esCliente ? (
            <button 
              onClick={manejarAgregarCarrito}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded hover:bg-secondary transition-colors font-medium"
            >
              <i className="fas fa-shopping-cart text-sm"></i>
              Agregar al carrito
            </button>
          ) : (
            <button 
              disabled
              className="flex-1 flex items-center justify-center gap-2 bg-gray-300 text-gray-500 py-2 px-4 rounded cursor-not-allowed font-medium"
              title="Solo clientes pueden comprar"
            >
              <i className="fas fa-lock text-sm"></i>
              Solo clientes
            </button>
          )}
          <button 
            onClick={() => onViewDetails(producto)}
            className="bg-gray-100 text-gray-700 p-2 rounded hover:bg-gray-200 transition-colors"
            title="Ver detalles"
          >
            <i className="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
  )
}