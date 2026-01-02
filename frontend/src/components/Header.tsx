import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import TypewriterText from '@/components/TypewriterText'

interface HeaderProps {
  onCartClick: () => void
}

export default function Header({ onCartClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const totalItems = useCartStore(state => state.obtenerTotalItems())
  const favorites = useUserStore(state => state.favorites)
  const { usuario: user, estaAutenticado: isAuthenticated, cerrarSesion: logout } = useAuthStore()
  
  console.log('🛒 Total items:', totalItems)
  console.log('❤️ Favoritos:', favorites.length)
  
  const userRole = user ? { name: user.rol, icon: 'fas fa-user', color: 'bg-primary' } : null

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/logo.png" 
              alt="Estilo y Moda" 
              className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
            />
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-wider" style={{ fontFamily: 'Dancing Script, cursive' }}>
              <TypewriterText 
                text="Estilo y Moda" 
                speed={150}
                style={{ fontFamily: 'Dancing Script, cursive' }}
              />
            </h1>
          </Link>
          
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              <button className="relative p-2 sm:p-3 text-gray-600 hover:text-primary transition-colors">
                <i className="fas fa-heart text-base sm:text-xl"></i>
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>
              <button 
                onClick={onCartClick}
                className="relative p-2 sm:p-3 text-gray-600 hover:text-primary transition-colors"
              >
                <i className="fas fa-shopping-cart text-base sm:text-xl"></i>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 ${userRole?.color || 'bg-gradient-to-r from-primary to-secondary'} rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform`}
                  >
                    <i className={`${userRole?.icon || 'fas fa-user'} text-white text-sm sm:text-lg`}></i>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 sm:top-14 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[200px]">
                      <div className="mb-3">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{user?.nombre}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{userRole?.name}</p>
                      </div>
                      <div className="border-t pt-3 space-y-2">
                        {/* Dashboard para gestores de productos */}
                        {['product_manager', 'category_manager', 'seller_premium'].includes(user?.rol || '') && (
                          <Link 
                            to="/products" 
                            onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <i className="fas fa-box mr-2"></i>
                            Gestión Productos
                          </Link>
                        )}
                        {/* Dashboard para administradores */}
                        {[
                          'ceo', 'cfo', 'cmo', 'operations_director', 'tech_director', 'regional_manager',
                          'brand_manager', 'inventory_manager', 'pricing_analyst', 
                          'content_editor', 'visual_merchandiser', 'photographer', 'customer_success', 
                          'support_agent', 'logistics_coordinator', 'qa_specialist', 'seller_standard', 'seller_basic'
                        ].includes(user?.rol || '') && (
                          <Link 
                            to="/admin" 
                            onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <i className="fas fa-tachometer-alt mr-2"></i>
                            Dashboard Admin
                          </Link>
                        )}
                        {/* Dashboard para Marketing Manager */}
                        {user?.rol === 'marketing_manager' && (
                          <Link 
                            to="/marketing" 
                            onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <i className="fas fa-megaphone mr-2"></i>
                            Dashboard Marketing
                          </Link>
                        )}
                        {/* Dashboard Customer Success */}
                        {user?.rol === 'customer_success' && (
                          <Link 
                            to="/customer-success" 
                            onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <i className="fas fa-headset mr-2"></i>
                            Customer Success
                          </Link>
                        )}
                        {/* Dashboard Logistics */}
                        {user?.rol === 'logistics_coordinator' && (
                          <Link 
                            to="/logistics" 
                            onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            <i className="fas fa-truck mr-2"></i>
                            Dashboard Logística
                          </Link>
                        )}
                        {/* Opciones solo para clientes */}
                        {user?.rol === 'cliente' && (
                          <>
                            <Link 
                              to="/orders" 
                              onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <i className="fas fa-shopping-bag mr-2"></i>
                              Pedidos
                            </Link>
                            <Link 
                              to="/favorites" 
                              onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <i className="fas fa-heart mr-2"></i>
                              Favoritos
                            </Link>
                            <Link 
                              to="/payments" 
                              onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <i className="fas fa-credit-card mr-2"></i>
                              Pagos
                            </Link>
                          </>
                        )}
                        <Link 
                          to="/profile" 
                          onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <i className="fas fa-user mr-2"></i>
                          Perfil
                        </Link>
                        <button 
                          onClick={() => {
                            logout()
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          <i className="fas fa-sign-out-alt mr-2"></i>
                          Salir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="bg-primary text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-secondary transition-colors">
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                  <i className="fas fa-sign-in-alt sm:hidden"></i>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}