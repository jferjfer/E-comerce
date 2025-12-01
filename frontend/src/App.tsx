import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import type { FutureConfig } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useOrderNotifications } from './hooks/useOrderNotifications'
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
import OrdersPage from './pages/OrdersPage'
import FavoritesPage from './pages/FavoritesPage'
import PaymentsPage from './pages/PaymentsPage'
import CustomerDashboard from './pages/CustomerDashboard'
import ProductManagerDashboard from './pages/admin/ProductManagerDashboard'

function App() {
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const { estaAutenticado } = useAuthStore()
  
  // Activar notificaciones de pedidos
  useOrderNotifications()

  const handleCheckout = () => {
    setShowCart(false)
    setShowCheckout(true)
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="bg-gray-50 text-gray-900 font-sans min-h-screen">
        <Header onCartClick={() => setShowCart(true)} />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          {/* AUTH ROUTES */}
          <Route path="/login" element={
            estaAutenticado ? <Navigate to="/" /> : <LoginPage />
          } />
          <Route path="/recuperar-contrasena" element={<RecoverPasswordPage />} />
          <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
          
          {/* CUSTOMER ROUTES */}
          <Route path="/customer-dashboard" element={
            <RoleGuard requiredRoles={['cliente']}>
              <CustomerDashboard />
            </RoleGuard>
          } />
          <Route path="/profile" element={
            estaAutenticado ? <ProfilePage /> : <Navigate to="/login" />
          } />
          <Route path="/orders" element={
            estaAutenticado ? <OrdersPage /> : <Navigate to="/login" />
          } />
          <Route path="/favorites" element={
            estaAutenticado ? <FavoritesPage /> : <Navigate to="/login" />
          } />
          <Route path="/payments" element={
            estaAutenticado ? <PaymentsPage /> : <Navigate to="/login" />
          } />
          
          {/* PRODUCT MANAGEMENT ROUTES */}
          <Route path="/products" element={
            <RoleGuard requiredRoles={['product_manager', 'category_manager', 'seller_premium']}>
              <ProductManagerDashboard />
            </RoleGuard>
          } />
          
          {/* ADMIN ROUTES */}
          <Route path="/admin" element={
            <RoleGuard requiredRoles={[
              'ceo', 'cfo', 'cmo', 'operations_director', 'tech_director', 'regional_manager',
              'brand_manager', 'inventory_manager', 'marketing_manager', 'pricing_analyst', 
              'content_editor', 'visual_merchandiser', 'photographer', 'customer_success', 
              'support_agent', 'logistics_coordinator', 'qa_specialist', 'seller_standard', 'seller_basic'
            ]}>
              <DashboardPage />
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