import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import Header from './components/Header'
import CartModal from './components/CartModal'
import CheckoutModal from './components/CheckoutModal'
import NotificationContainer from './components/Notification'
import AIAssistant from './components/AIAssistant'
import RoleGuard from './components/auth/RoleGuard'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsManager from './pages/admin/ProductsManager'
import RecoverPasswordPage from './pages/RecoverPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const { estaAutenticado } = useAuthStore()

  const handleCheckout = () => {
    setShowCart(false)
    setShowCheckout(true)
  }

  return (
    <Router>
      <div className="bg-gray-50 text-gray-900 font-sans min-h-screen">
        <Header onCartClick={() => setShowCart(true)} />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/login" element={
            estaAutenticado ? <Navigate to="/dashboard" /> : <LoginPage />
          } />
          <Route path="/recuperar-contrasena" element={<RecoverPasswordPage />} />
          <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={
            <RoleGuard requiredRoles={['ceo', 'cfo', 'cmo', 'category_manager', 'product_manager', 'content_editor', 'support_agent', 'seller_premium']}>
              <DashboardPage />
            </RoleGuard>
          } />
          <Route path="/profile" element={
            estaAutenticado ? <ProfilePage /> : <Navigate to="/login" />
          } />
          <Route path="/admin/products" element={
            <RoleGuard requiredPermissions={['products:read']}>
              <ProductsManager />
            </RoleGuard>
          } />
        </Routes>
        
        <CartModal 
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
        />
        
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
        />
        
        <NotificationContainer />
        <AIAssistant />
      </div>
    </Router>
  )
}

export default App