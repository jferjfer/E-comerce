import { RoleDefinition, Permission } from '@/types/auth'

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  // NIVEL EJECUTIVO
  ceo: {
    role: 'ceo',
    name: 'CEO/Founder',
    description: 'Control total del sistema',
    level: 1,
    color: 'bg-purple-600',
    icon: 'fas fa-crown',
    permissions: ['*'] as Permission[]
  },
  
  cfo: {
    role: 'cfo',
    name: 'CFO',
    description: 'Director Financiero',
    level: 2,
    color: 'bg-green-600',
    icon: 'fas fa-chart-line',
    permissions: ['analytics:sales', 'analytics:profit', 'pricing:view', 'pricing:approve', 'orders:view']
  },
  
  cmo: {
    role: 'cmo',
    name: 'CMO',
    description: 'Director de Marketing',
    level: 2,
    color: 'bg-pink-600',
    icon: 'fas fa-bullhorn',
    permissions: ['promotions:create', 'promotions:approve', 'analytics:customers', 'content:publish']
  },

  category_manager: {
    role: 'category_manager',
    name: 'Gerente de Categoría',
    description: 'Gestión de categoría específica',
    level: 4,
    color: 'bg-orange-600',
    icon: 'fas fa-tags',
    permissions: ['products:create', 'products:update', 'products:publish', 'pricing:edit', 'promotions:create']
  },

  product_manager: {
    role: 'product_manager',
    name: 'Gestor de Productos',
    description: 'CRUD de productos',
    level: 5,
    color: 'bg-teal-600',
    icon: 'fas fa-box',
    permissions: ['products:create', 'products:update', 'products:read', 'inventory:view']
  },

  content_editor: {
    role: 'content_editor',
    name: 'Editor de Contenido',
    description: 'Gestión de contenido',
    level: 5,
    color: 'bg-cyan-600',
    icon: 'fas fa-edit',
    permissions: ['content:edit', 'products:read', 'products:update']
  },

  support_agent: {
    role: 'support_agent',
    name: 'Agente de Soporte',
    description: 'Atención al cliente',
    level: 6,
    color: 'bg-blue-500',
    icon: 'fas fa-headset',
    permissions: ['orders:view', 'orders:process', 'users:view']
  },

  seller_premium: {
    role: 'seller_premium',
    name: 'Vendedor Premium',
    description: 'Vendedor de alto volumen',
    level: 7,
    color: 'bg-amber-600',
    icon: 'fas fa-store',
    permissions: ['products:create', 'products:update', 'analytics:sales', 'orders:view']
  },

  regular_customer: {
    role: 'regular_customer',
    name: 'Cliente Regular',
    description: 'Cliente estándar',
    level: 11,
    color: 'bg-gray-500',
    icon: 'fas fa-user',
    permissions: ['orders:view']
  }
}

export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes('*' as Permission) || userPermissions.includes(requiredPermission)
}

export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  return requiredRoles.some(role => userRoles.includes(role))
}

export const getRoleLevel = (role: string): number => {
  return ROLE_DEFINITIONS[role]?.level || 999
}