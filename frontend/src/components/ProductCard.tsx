import { useState } from 'react'
import { Producto } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatPrice } from '@/utils/sanitize'

interface PropsTarjetaProducto {
  product: Producto
  onViewDetails: (producto: Producto) => void
}

export default function ProductCard({ product: producto, onViewDetails }: PropsTarjetaProducto) {
  const [agregando, setAgregando] = useState(false)
  const agregarItem = useCartStore(state => state.agregarItem)
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserStore()
  const { usuario } = useAuthStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const manejarAgregarCarrito = async () => {
    setAgregando(true)
    agregarItem(producto)
    addNotification(`${producto.nombre} agregado al carrito`, 'success')
    setTimeout(() => setAgregando(false), 600)
  }

  const manejarToggleFavorito = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id)
      addNotification('Eliminado de favoritos', 'info')
    } else {
      addToFavorites(producto.id)
      addNotification('Agregado a favoritos', 'success')
    }
  }

  const renderStars = (rating: number) => (
    Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`fas fa-star text-[10px] ${i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} />
    ))
  )

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-hover border border-gray-100 group">
      {/* Imagen */}
      <div className="relative overflow-hidden bg-gray-50" style={{ paddingBottom: '120%' }}>
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Overlay acciones */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

        {/* Botón favorito */}
        <button
          onClick={manejarToggleFavorito}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            isFavorite(producto.id)
              ? 'bg-rose-500 text-white scale-110'
              : 'bg-white/90 text-gray-400 hover:text-rose-500 hover:scale-110'
          }`}
        >
          <i className={`${isFavorite(producto.id) ? 'fas' : 'far'} fa-heart text-xs`}></i>
        </button>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {producto.es_eco && (
            <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              ECO
            </span>
          )}
          {producto.compatibilidad && producto.compatibilidad >= 90 && (
            <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {producto.compatibilidad}% IA
            </span>
          )}
        </div>

        {/* Botón ver detalles en hover */}
        <button
          onClick={() => onViewDetails(producto)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-gray-800 text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-gray-100"
        >
          <i className="fas fa-eye mr-1.5 text-primary"></i>
          Ver detalles
        </button>
      </div>

      {/* Contenido */}
      <div className="p-3">
        {/* Categoría y estrellas */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{producto.categoria}</span>
          <div className="flex gap-0.5">{renderStars(producto.calificacion)}</div>
        </div>

        {/* Nombre */}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2">{producto.nombre}</h3>

        {/* Precio y botón */}
        <div className="flex items-center justify-between gap-1.5 mt-auto">
          <span className="text-sm sm:text-base font-bold text-primary truncate">{formatPrice(producto.precio)}</span>
          <button
            onClick={manejarAgregarCarrito}
            disabled={agregando}
            className={`flex-shrink-0 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 ${
              agregando
                ? 'bg-emerald-500 text-white scale-95'
                : 'bg-primary text-white hover:bg-secondary hover:shadow-md hover:shadow-gray-300'
            }`}
          >
            <i className={`fas ${agregando ? 'fa-check' : 'fa-cart-plus'} text-xs`}></i>
            <span className="hidden sm:inline">{agregando ? '¡Listo!' : 'Agregar'}</span>
            <span className="sm:hidden">{agregando ? '¡Ok!' : '+'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
