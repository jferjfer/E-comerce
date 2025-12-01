import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { Link } from 'react-router-dom'

export default function CustomerDashboard() {
  const { usuario } = useAuthStore()
  const totalItems = useCartStore(state => state.obtenerTotalItems())
  const [showPromo, setShowPromo] = useState(true)

  const roleInfo = { name: 'Cliente', color: 'bg-blue-500', icon: '👤' }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Promoción Banner */}
        {showPromo && (
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-4 mb-6 shadow-lg relative">
            <button 
              onClick={() => setShowPromo(false)}
              className="absolute top-2 right-2 text-white hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ×
            </button>
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center">
                <i className="fas fa-fire text-2xl mr-3 animate-pulse"></i>
                <div>
                  <h3 className="text-lg font-bold">🔥 OFERTA ESPECIAL</h3>
                  <p className="text-sm opacity-90">50% OFF en toda la colección de verano • Válido hasta el 31 de Enero</p>
                </div>
              </div>
              <Link 
                to="/catalog"
                className="bg-white text-red-500 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Ver Ofertas
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Hola, {usuario?.nombre}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Bienvenido a tu panel personal</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-4 py-2 ${roleInfo.color} text-white rounded-full text-sm font-medium`}>
                {roleInfo.icon} {roleInfo.name}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">En tu carrito</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="fas fa-shopping-bag text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <i className="fas fa-heart text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Favoritos</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <i className="fas fa-star text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Puntos</p>
                <p className="text-2xl font-bold text-gray-900">2,450</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/catalog" 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-search text-2xl text-blue-600 mb-2"></i>
                <span className="text-sm font-medium">Explorar</span>
              </Link>
              <Link 
                to="/orders" 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-shopping-bag text-2xl text-green-600 mb-2"></i>
                <span className="text-sm font-medium">Mis Pedidos</span>
              </Link>
              <Link 
                to="/favorites" 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-heart text-2xl text-red-600 mb-2"></i>
                <span className="text-sm font-medium">Favoritos</span>
              </Link>
              <Link 
                to="/profile" 
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-user text-2xl text-purple-600 mb-2"></i>
                <span className="text-sm font-medium">Mi Perfil</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Pedidos</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Pedido #EM-001234</p>
                  <p className="text-sm text-gray-600">3 productos • $289.997</p>
                  <p className="text-xs text-gray-500">Hace 2 días</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Entregado
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Pedido #EM-001233</p>
                  <p className="text-sm text-gray-600">1 producto • $89.999</p>
                  <p className="text-xs text-gray-500">Hace 5 días</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  En camino
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Pedido #EM-001232</p>
                  <p className="text-sm text-gray-600">2 productos • $159.998</p>
                  <p className="text-xs text-gray-500">Hace 1 semana</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Entregado
                </span>
              </div>
            </div>
            <Link 
              to="/orders" 
              className="block text-center mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos los pedidos →
            </Link>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recomendado para Ti</h3>
            <Link to="/catalog" className="text-primary hover:text-secondary text-sm font-medium">
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { id: 1, name: 'Vestido Elegante', price: 89999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop' },
              { id: 2, name: 'Blazer Moderno', price: 129999, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop' },
              { id: 3, name: 'Pantalón Casual', price: 69999, image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=400&fit=crop' },
              { id: 4, name: 'Camisa Premium', price: 79999, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=400&fit=crop' }
            ].map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600">Calidad premium</p>
                <p className="text-lg font-bold text-primary mt-2">${(item.price / 100).toLocaleString()}</p>
                <Link 
                  to="/catalog"
                  className="block w-full mt-3 bg-primary text-white py-2 rounded-lg hover:bg-secondary transition-colors text-center"
                >
                  Ver Detalles
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}