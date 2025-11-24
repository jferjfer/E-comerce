import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole, Permission } from '@/types/auth'
import { hasPermission, hasAnyRole } from '@/config/roles'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  hasRole: (roles: UserRole | UserRole[]) => boolean
  canAccess: (requiredRoles?: UserRole[], requiredPermissions?: Permission[]) => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulación de login - en producción sería API call
        const mockUsers: Record<string, User> = {
          'admin@stylehub.com': {
            id: '1',
            email: 'admin@stylehub.com',
            name: 'Admin StyleHub',
            roles: ['ceo'],
            permissions: ['*'] as Permission[],
            organizationId: 'stylehub',
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date()
          },
          'manager@stylehub.com': {
            id: '2',
            email: 'manager@stylehub.com',
            name: 'Category Manager',
            roles: ['category_manager'],
            permissions: ['products:create', 'products:update', 'products:publish', 'pricing:edit'],
            organizationId: 'stylehub',
            categoryIds: ['women', 'men'],
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date()
          },
          'editor@stylehub.com': {
            id: '3',
            email: 'editor@stylehub.com',
            name: 'Content Editor',
            roles: ['content_editor'],
            permissions: ['content:edit', 'products:read', 'products:update'],
            organizationId: 'stylehub',
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date()
          },
          'customer@stylehub.com': {
            id: '4',
            email: 'customer@stylehub.com',
            name: 'Regular Customer',
            roles: ['regular_customer'],
            permissions: ['orders:view'],
            organizationId: 'stylehub',
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date()
          }
        }

        const user = mockUsers[email]
        if (user && password === '123456') {
          set({ user, isAuthenticated: true })
          return true
        }
        return false
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      hasPermission: (permission: Permission) => {
        const { user } = get()
        if (!user) return false
        return hasPermission(user.permissions, permission)
      },

      hasRole: (roles: UserRole | UserRole[]) => {
        const { user } = get()
        if (!user) return false
        const roleArray = Array.isArray(roles) ? roles : [roles]
        return hasAnyRole(user.roles, roleArray)
      },

      canAccess: (requiredRoles?: UserRole[], requiredPermissions?: Permission[]) => {
        const { user } = get()
        if (!user) return false

        if (requiredRoles && !hasAnyRole(user.roles, requiredRoles)) {
          return false
        }

        if (requiredPermissions) {
          return requiredPermissions.every(permission => 
            hasPermission(user.permissions, permission)
          )
        }

        return true
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)