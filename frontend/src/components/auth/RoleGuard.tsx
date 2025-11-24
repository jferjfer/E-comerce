import { ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface RoleGuardProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  fallback?: ReactNode
}

export default function RoleGuard({ 
  children, 
  requiredRoles, 
  requiredPermissions, 
  fallback
}: RoleGuardProps) {
  const { estaAutenticado, usuario } = useAuthStore()

  // Si no está autenticado, no mostrar contenido
  if (!estaAutenticado || !usuario) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Acceso Restringido</h3>
          <p className="text-gray-500">Debes iniciar sesión para ver este contenido</p>
        </div>
      </div>
    )
  }

  // Por ahora, permitir acceso a usuarios autenticados
  // TODO: Implementar lógica de roles más adelante
  return <>{children}</>
}