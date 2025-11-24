import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLE_DEFINITIONS } from '@/config/roles'
import { Link } from 'react-router-dom'
import TypewriterText from '@/components/TypewriterText'

interface HeaderProps {
  onCartClick: () => void
}

export default function Header({ onCartClick }: HeaderProps) {
  const totalItems = useCartStore(state => state.getTotalItems())
  const favorites = useUserStore(state => state.favorites)
  const { user, isAuthenticated, logout } = useAuthStore()
  
  const userRole = user ? ROLE_DEFINITIONS[user.roles[0]] : null
  
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Estilo y Moda" 
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-4xl font-bold text-primary tracking-wider" style={{ fontFamily: 'Dancing Script, cursive' }}>
              <TypewriterText 
                text="Estilo y Moda" 
                speed={150}
                style={{ fontFamily: 'Dancing Script, cursive' }}
              />
            </h1>
          </Link>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <button className="relative p-3 text-gray-600 hover:text-primary transition-colors">
                <i className="fas fa-heart text-xl"></i>
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>
              <button 
                onClick={onCartClick}
                className="relative p-3 text-gray-600 hover:text-primary transition-colors"
              >
                <i className="fas fa-shopping-cart text-xl"></i>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              {isAuthenticated ? (
                <div className="relative group">
                  <div className={`w-12 h-12 ${userRole?.color || 'bg-gradient-to-r from-primary to-secondary'} rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform`}>
                    <i className={`${userRole?.icon || 'fas fa-user'} text-white text-lg`}></i>
                  </div>
                  <div className="absolute right-0 top-14 bg-white rounded-lg shadow-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50 min-w-[200px]">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-600">{userRole?.name}</p>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <Link to="/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                        <i className="fas fa-tachometer-alt mr-2"></i>
                        Dashboard
                      </Link>
                      <Link to="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                        <i className="fas fa-user mr-2"></i>
                        Mi Perfil
                      </Link>
                      <button 
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}