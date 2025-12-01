import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { useCartStore } from '@/store/useCartStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { api } from '@/services/api'
import { Producto } from '@/types'
import { formatPrice } from '@/utils/sanitize'

export default function FavoritesPage() {
  const { favorites, removeFromFavorites } = useUserStore()
  const agregarItem = useCartStore(state => state.agregarItem)
  const addNotification = useNotificationStore(state => state.addNotification)
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarProductosFavoritos()
  }, [favorites])

  const cargarProductosFavoritos = async () => {
    setCargando(true)
    try {
      const { productos: todosProductos } = await api.obtenerProductos()
      const productosFavoritos = todosProductos.filter(p => favorites.includes(p.id))
      setProductos(productosFavoritos)
    } catch (error) {
      console.error('Error cargando favoritos:', error)
    } finally {
      setCargando(false)
    }
  }

  const eliminarFavorito = (productoId: string) => {
    removeFromFavorites(productoId)
    addNotification('Eliminado de favoritos', 'info')
  }

  const agregarAlCarrito = (producto: Producto) => {
    agregarItem(producto)
    addNotification(`${producto.nombre} agregado al carrito`, 'success')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary hover:text-secondary">
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </Link>
            <h1 className="text-3xl font-bold text-primary">
              <i className="fas fa-heart text-red-500 mr-3"></i>
              Mis Favoritos
            </h1>
          </div>
          <span className="text-sm text-gray-600">
            {productos.length} producto(s)
          </span>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : productos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <i className="fas fa-heart-broken text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes favoritos aún</h3>
            <p className="text-gray-500 mb-6">Agrega productos que te gusten para verlos aquí</p>
            <Link to="/catalog" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-secondary transition-colors">
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <div key={producto.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img 
                    src={producto.imagen} 
                    alt={producto.nombre}
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => eliminarFavorito(producto.id)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white"
                  >
                    <i className="fas fa-times text-red-500"></i>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{producto.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{producto.descripcion}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">{formatPrice(producto.precio)}</span>
                  </div>
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
