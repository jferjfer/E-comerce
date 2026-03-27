import { useState } from 'react'
import { Producto } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
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

  return (
    <div className="bg-[#111111] rounded-none overflow-hidden group border border-white/5 hover:border-gold/30 transition-all duration-500">
      {/* Imagen */}
      <div className="relative overflow-hidden bg-[#0a0a0a]" style={{ paddingBottom: '130%' }}>
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Botón favorito */}
        <button
          onClick={manejarToggleFavorito}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFavorite(producto.id)
              ? 'bg-rose-500 text-white'
              : 'bg-black/50 text-gray-400 hover:text-rose-400 backdrop-blur-sm'
          }`}
        >
          <i className={`${isFavorite(producto.id) ? 'fas' : 'far'} fa-heart text-xs`}></i>
        </button>

        {/* Botón ver detalles en hover */}
        <button
          onClick={() => onViewDetails(producto)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-gold text-xs font-prata tracking-[3px] uppercase px-5 py-2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-gold/40 hover:bg-gold hover:text-black"
        >
          Ver
        </button>
      </div>

      {/* Contenido */}
      <div className="p-3 pb-4">
        {/* Nombre */}
        <h3 className="text-xs font-normal text-gray-300 uppercase tracking-[1px] line-clamp-2 leading-relaxed mb-2">
          {producto.nombre}
        </h3>

        {/* Precio */}
        <p className="font-bodoni text-base text-gold">{formatPrice(producto.precio)}</p>

        {/* Botón agregar */}
        <button
          onClick={manejarAgregarCarrito}
          disabled={agregando}
          className={`w-full mt-3 py-2 text-[10px] font-semibold tracking-[3px] uppercase transition-all duration-300 ${
            agregando
              ? 'bg-gold text-black'
              : 'bg-transparent border border-white/20 text-gray-300 hover:border-gold hover:text-gold'
          }`}
        >
          {agregando ? '✓ Agregado' : 'Agregar'}
        </button>
      </div>
    </div>
  )
}
