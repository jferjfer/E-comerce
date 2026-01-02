import { Producto } from '@/types'
import { useCartStore } from '@/store/useCartStore'
import { Link } from 'react-router-dom'

interface ProductRecommendationProps {
  producto: Producto
  razon?: string
  puntuacion?: number
}

export default function ProductRecommendation({ producto, razon, puntuacion }: ProductRecommendationProps) {
  const { agregarItem } = useCartStore()

  const handleAddToCart = () => {
    agregarItem(producto)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        <Link to={`/catalog?producto=${producto.id}`} className="flex-shrink-0">
          <img 
            src={producto.imagen} 
            alt={producto.nombre}
            className="w-20 h-20 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/catalog?producto=${producto.id}`}>
            <h4 className="font-semibold text-sm text-gray-900 truncate hover:text-purple-600 transition-colors">{producto.nombre}</h4>
          </Link>
          <p className="text-purple-600 font-bold text-sm mt-1">
            ${(producto.precio / 100).toLocaleString('es-CO')}
          </p>
          {razon && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{razon}</p>
          )}
          {puntuacion && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-500">Match:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                <div 
                  className="bg-purple-500 h-1.5 rounded-full" 
                  style={{ width: `${puntuacion * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-purple-600">
                {Math.round(puntuacion * 100)}%
              </span>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Link 
              to={`/catalog?producto=${producto.id}`}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <i className="fas fa-eye"></i>
              Ver detalles
            </Link>
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          className="self-start bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          <i className="fas fa-cart-plus mr-1"></i>
          Agregar
        </button>
      </div>
    </div>
  )
}
