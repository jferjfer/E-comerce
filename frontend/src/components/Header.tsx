import { useCartStore } from '@/store/useCartStore'
import { useUserStore } from '@/store/useUserStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import TypewriterText from '@/components/TypewriterText'
import { ROLE_DEFINITIONS } from '@/config/roles'

interface HeaderProps {
  onCartClick: () => void
}

export default function Header({ onCartClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const totalItems = useCartStore(state => state.obtenerTotalItems())
  const favorites = useUserStore(state => state.favorites)
  const { usuario: user, estaAutenticado: isAuthenticated, cerrarSesion: logout } = useAuthStore()

  const roleInfo = user?.rol ? ROLE_DEFINITIONS[user.rol] : null
  const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : '?'

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
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="flex justify-between items-center h-16 sm:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
            <div className="w-8 h-8 sm:w-11 sm:h-11 flex-shrink-0 rounded-xl brand-gradient flex items-center justify-center shadow-md group-hover:shadow-gray-200 transition-shadow">
              <img src="/logo.png" alt="Estilo y Moda" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
            </div>
            <h1 className="text-lg sm:text-3xl font-bold text-primary tracking-wider truncate" style={{ fontFamily: 'Dancing Script, cursive' }}>
              <span className="hidden xs:inline">
                <TypewriterText text="Estilo y Moda" speed={150} style={{ fontFamily: 'Dancing Script, cursive' }} />
              </span>
              <span className="xs:hidden">E&amp;M</span>
            </h1>
          </Link>

          {/* Acciones */}
          <div className="flex items-center space-x-1 sm:space-x-2">

            {/* Favoritos */}
            <Link to={isAuthenticated ? '/favorites' : '/login'} className="relative p-2 sm:p-2.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition-all">
              <i className="fas fa-heart text-base sm:text-lg"></i>
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {favorites.length > 9 ? '9+' : favorites.length}
                </span>
              )}
            </Link>

            {/* Carrito */}
            <button onClick={onCartClick} className="relative p-2 sm:p-2.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-xl transition-all">
              <i className="fas fa-shopping-bag text-base sm:text-lg"></i>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Usuario */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-all group"
                >
                  {/* Avatar con inicial */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${roleInfo?.color || 'bg-primary'} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                    <span className="text-white font-bold text-sm">{inicial}</span>
                  </div>
                  {/* Nombre en desktop */}
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.nombre?.split(' ')[0]}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{roleInfo?.name || user?.rol}</p>
                  </div>
                  <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 min-w-[220px] animate-fadeIn">
                    {/* Info usuario */}
                    <div className="px-3 py-2 mb-1 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">{user?.nombre}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className={`inline-block mt-1 role-badge ${roleInfo?.color || 'bg-gray-500'} text-white`}>
                        <i className={`${roleInfo?.icon || 'fas fa-user'} mr-1`}></i>
                        {roleInfo?.name || user?.rol}
                      </span>
                    </div>

                    {/* Links según rol */}
                    <div className="space-y-0.5">
                      {['product_manager', 'category_manager', 'seller_premium'].includes(user?.rol || '') && (
                        <MenuItem to="/products" icon="fa-box" label="Gestión Productos" onClick={() => setShowUserMenu(false)} />
                      )}
                      {['ceo', 'cfo', 'cmo', 'operations_director', 'tech_director', 'regional_manager',
                        'brand_manager', 'inventory_manager', 'pricing_analyst', 'content_editor',
                        'visual_merchandiser', 'photographer', 'customer_success', 'support_agent',
                        'logistics_coordinator', 'qa_specialist', 'seller_standard', 'seller_basic'
                      ].includes(user?.rol || '') && (
                        <MenuItem to="/admin" icon="fa-tachometer-alt" label="Dashboard Admin" onClick={() => setShowUserMenu(false)} />
                      )}
                      {user?.rol === 'ceo' && (
                        <MenuItem to="/ceo" icon="fa-crown" label="Dashboard CEO" onClick={() => setShowUserMenu(false)} />
                      )}
                      {user?.rol === 'marketing_manager' && (
                        <MenuItem to="/marketing" icon="fa-megaphone" label="Dashboard Marketing" onClick={() => setShowUserMenu(false)} />
                      )}
                      {user?.rol === 'customer_success' && (
                        <MenuItem to="/customer-success" icon="fa-headset" label="Customer Success" onClick={() => setShowUserMenu(false)} />
                      )}
                      {user?.rol === 'logistics_coordinator' && (
                        <MenuItem to="/logistics" icon="fa-truck" label="Dashboard Logística" onClick={() => setShowUserMenu(false)} />
                      )}
                      {user?.rol === 'cliente' && (
                        <>
                          <MenuItem to="/orders" icon="fa-shopping-bag" label="Mis Pedidos" onClick={() => setShowUserMenu(false)} />
                          <MenuItem to="/favorites" icon="fa-heart" label="Favoritos" onClick={() => setShowUserMenu(false)} />
                          <MenuItem to="/payments" icon="fa-credit-card" label="Pagos" onClick={() => setShowUserMenu(false)} />
                        </>
                      )}
                      <MenuItem to="/profile" icon="fa-user-circle" label="Mi Perfil" onClick={() => setShowUserMenu(false)} />
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false) }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <i className="fas fa-sign-out-alt w-4"></i>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex items-center space-x-1.5 bg-primary text-white px-2.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl hover:bg-secondary transition-all shadow-sm flex-shrink-0">
                <i className="fas fa-sign-in-alt text-xs"></i>
                <span className="hidden sm:inline font-medium">Iniciar Sesión</span>
                <span className="sm:hidden font-medium">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function MenuItem({ to, icon, label, onClick }: { to: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center space-x-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary rounded-xl transition-colors"
    >
      <i className={`fas ${icon} w-4 text-gray-400`}></i>
      <span>{label}</span>
    </Link>
  )
}
