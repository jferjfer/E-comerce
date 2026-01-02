import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import HomePage from '@/pages/HomePage'

export default function RoleBasedHome() {
  const { usuario, estaAutenticado } = useAuthStore()

  // Si no está autenticado, mostrar productos (HomePage)
  if (!estaAutenticado || !usuario) {
    return <HomePage />
  }

  // Si es cliente, mostrar productos
  if (usuario.rol === 'cliente') {
    return <HomePage />
  }

  // Product Managers → Dashboard de productos
  if (['product_manager', 'category_manager', 'seller_premium'].includes(usuario.rol)) {
    return <Navigate to="/products" replace />
  }

  // Marketing Manager → Dashboard de marketing
  if (usuario.rol === 'marketing_manager') {
    return <Navigate to="/marketing" replace />
  }

  // Customer Success → Dashboard Customer Success
  if (usuario.rol === 'customer_success') {
    return <Navigate to="/customer-success" replace />
  }

  // Logistics Coordinator → Dashboard Logística
  if (usuario.rol === 'logistics_coordinator') {
    return <Navigate to="/logistics" replace />
  }

  // Todos los demás roles administrativos → Dashboard admin
  return <Navigate to="/admin" replace />
}
