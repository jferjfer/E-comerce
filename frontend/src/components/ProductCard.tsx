import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Producto } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatPrice } from '@/utils/sanitize'
import { API_URL } from '@/config/api'

interface PropsTarjetaProducto {
  product: Producto
  onViewDetails: (producto: Producto) => void
}

export default function ProductCard({ product: producto, onViewDetails }: PropsTarjetaProducto) {
  const [agregando, setAgregando] = useState(false)
  const [mostrarSelector, setMostrarSelector] = useState(false)
  const [tallaSeleccionada, setTallaSeleccionada] = useState('')
  const [colorSeleccionado, setColorSeleccionado] = useState('')
  const agregarItem = useCartStore(state => state.agregarItem)
  const { addToFavorites, removeFromFavorites, isFavorite } = useUserStore()
  const { usuario } = useAuthStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const tieneTallas = producto.tallas && producto.tallas.length > 0
  const tieneColores = producto.colores && producto.colores.length > 0
  const necesitaSelector = tieneTallas || tieneColores

  const manejarClickAgregar = () => {
    if (necesitaSelector && !mostrarSelector) {
      setTallaSeleccionada(producto.tallas?.[0] || '')
      setColorSeleccionado(producto.colores?.[0] || '')
      setMostrarSelector(true)
      return
    }
    confirmarAgregarCarrito()
  }

  const confirmarAgregarCarrito = async () => {
    setAgregando(true)
    setMostrarSelector(false)
    agregarItem({ ...producto, talla: tallaSeleccionada || undefined, color: colorSeleccionado || undefined } as any)
    addNotification(`${producto.nombre}${tallaSeleccionada ? ` (${tallaSeleccionada})` : ''} agregado al carrito`, 'success')
    setTimeout(() => setAgregando(false), 600)
  }

  const manejarToggleFavorito = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { token } = useAuthStore.getState()
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id)
      addNotification('Eliminado de favoritos', 'info')
      if (token) {
        try {
          await fetch(`${API_URL}/api/listas-deseos/${producto.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
        } catch {}
      }
    } else {
      addToFavorites(producto.id)
      addNotification('Agregado a favoritos', 'success')
      if (token) {
        try {
          await fetch(`${API_URL}/api/listas-deseos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ producto_id: producto.id })
          })
        } catch {}
      }
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
        <Link to={`/producto/${producto.id}`} className="absolute inset-0">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

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
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2">
          <Link to={`/producto/${producto.id}`} className="hover:text-primary transition-colors">
            {producto.nombre}
          </Link>
        </h3>

        {/* Precio */}
        <p className="text-base font-bold text-primary mb-1">{formatPrice(producto.precio)}</p>

        {/* Stock */}
        <p className={`text-[11px] font-medium mb-2 ${
          producto.en_stock ? 'text-emerald-600' : 'text-red-500'
        }`}>
          <i className={`fas ${producto.en_stock ? 'fa-check-circle' : 'fa-times-circle'} mr-1`}></i>
          {producto.en_stock ? 'Disponible' : 'Agotado'}
        </p>

        {/* Selector talla/color inline */}
        {mostrarSelector && (
          <div className="mb-2 p-2 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            {tieneTallas && (
              <div>
                <p className="text-[10px] text-gray-500 font-medium mb-1">Talla</p>
                <div className="flex flex-wrap gap-1">
                  {producto.tallas!.map(t => (
                    <button
                      key={t}
                      onClick={() => setTallaSeleccionada(t)}
                      className={`px-2 py-0.5 text-xs rounded-lg border transition-all ${
                        tallaSeleccionada === t
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 text-gray-600 hover:border-primary'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
            )}
            {tieneColores && (
              <div>
                <p className="text-[10px] text-gray-500 font-medium mb-1">Color</p>
                <div className="flex flex-wrap gap-1">
                  {producto.colores!.map(c => (
                    <button
                      key={c}
                      onClick={() => setColorSeleccionado(c)}
                      className={`px-2 py-0.5 text-xs rounded-lg border transition-all ${
                        colorSeleccionado === c
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 text-gray-600 hover:border-primary'
                      }`}
                    >{c}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => setMostrarSelector(false)}
                className="flex-1 text-xs py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100"
              >Cancelar</button>
              <button
                onClick={confirmarAgregarCarrito}
                className="flex-1 text-xs py-1.5 rounded-lg bg-primary text-white hover:bg-secondary"
              >Confirmar</button>
            </div>
          </div>
        )}

        {/* Botón */}
        <button
          onClick={manejarClickAgregar}
          disabled={agregando || !producto.en_stock}
          className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 rounded-xl transition-all duration-200 ${
            !producto.en_stock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : agregando
              ? 'bg-emerald-500 text-white scale-95'
              : 'bg-primary text-white hover:bg-secondary'
          }`}
        >
          <i className={`fas ${agregando ? 'fa-check' : !producto.en_stock ? 'fa-ban' : 'fa-cart-plus'} text-xs`}></i>
          <span>{agregando ? '¡Agregado!' : !producto.en_stock ? 'Agotado' : 'Agregar al carrito'}</span>
        </button>
      </div>
    </div>
  )
}
