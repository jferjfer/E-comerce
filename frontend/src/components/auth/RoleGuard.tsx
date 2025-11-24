import { ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { UserRole, Permission } from '@/types/auth'

interface RoleGuardProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  requiredPermissions?: Permission[]
  fallback?: ReactNode
}

export default function RoleGuard({ 
  children, 
  requiredRoles, 
  requiredPermissions, 
  fallback
}: RoleGuardProps) {
  const { canAccess } = useAuthStore()

  if (!canAccess(requiredRoles, requiredPermissions)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Acceso Restringido</h3>
          <p className="text-gray-500">No tienes permisos para ver este contenido</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}