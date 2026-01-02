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

  // NIVEL DIRECTIVO
  operations_director: {
    role: 'operations_director',
    name: 'Director de Operaciones',
    description: 'Gestión operacional completa',
    level: 3,
    color: 'bg-indigo-600',
    icon: 'fas fa-cogs',
    permissions: ['operations:manage', 'analytics:operations', 'users:manage', 'inventory:manage']
  },

  tech_director: {
    role: 'tech_director',
    name: 'Director Técnico',
    description: 'Gestión técnica y desarrollo',
    level: 3,
    color: 'bg-blue-600',
    icon: 'fas fa-code',
    permissions: ['system:config', 'system:logs', 'system:backup', 'analytics:technical']
  },

  regional_manager: {
    role: 'regional_manager',
    name: 'Gerente Regional',
    description: 'Gestión por zona geográfica',
    level: 3,
    color: 'bg-emerald-600',
    icon: 'fas fa-globe-americas',
    permissions: ['analytics:regional', 'users:regional', 'inventory:regional', 'orders:regional']
  },

  // NIVEL GERENCIAL
  category_manager: {
    role: 'category_manager',
    name: 'Gerente de Categoría',
    description: 'Gestión de categoría específica',
    level: 4,
    color: 'bg-orange-600',
    icon: 'fas fa-tags',
    permissions: ['products:create', 'products:update', 'products:publish', 'pricing:edit', 'promotions:create']
  },

  brand_manager: {
    role: 'brand_manager',
    name: 'Gerente de Marca',
    description: 'Gestión de marca específica',
    level: 4,
    color: 'bg-rose-600',
    icon: 'fas fa-award',
    permissions: ['products:brand', 'promotions:brand', 'analytics:brand', 'content:brand']
  },

  inventory_manager: {
    role: 'inventory_manager',
    name: 'Gerente de Inventario',
    description: 'Gestión completa de inventario',
    level: 4,
    color: 'bg-amber-600',
    icon: 'fas fa-warehouse',
    permissions: ['inventory:manage', 'inventory:transfer', 'analytics:inventory', 'orders:inventory']
  },

  marketing_manager: {
    role: 'marketing_manager',
    name: 'Gerente de Marketing',
    description: 'Gestión de campañas y promociones',
    level: 4,
    color: 'bg-fuchsia-600',
    icon: 'fas fa-megaphone',
    permissions: ['promotions:create', 'promotions:update', 'analytics:marketing', 'content:marketing']
  },

  // NIVEL OPERATIVO
  product_manager: {
    role: 'product_manager',
    name: 'Gestor de Productos',
    description: 'CRUD de productos',
    level: 5,
    color: 'bg-teal-600',
    icon: 'fas fa-box',
    permissions: ['products:create', 'products:update', 'products:read', 'inventory:view']
  },

  pricing_analyst: {
    role: 'pricing_analyst',
    name: 'Analista de Precios',
    description: 'Análisis y optimización de precios',
    level: 5,
    color: 'bg-lime-600',
    icon: 'fas fa-calculator',
    permissions: ['pricing:view', 'pricing:edit', 'analytics:pricing', 'products:read']
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

  visual_merchandiser: {
    role: 'visual_merchandiser',
    name: 'Merchandiser Visual',
    description: 'Diseño y experiencia visual',
    level: 5,
    color: 'bg-violet-600',
    icon: 'fas fa-palette',
    permissions: ['content:visual', 'products:visual', 'analytics:visual']
  },

  photographer: {
    role: 'photographer',
    name: 'Fotógrafo',
    description: 'Gestión de imágenes y multimedia',
    level: 6,
    color: 'bg-slate-600',
    icon: 'fas fa-camera',
    permissions: ['content:images', 'products:images']
  },

  customer_success: {
    role: 'customer_success',
    name: 'Éxito del Cliente',
    description: 'Retención y satisfacción',
    level: 6,
    color: 'bg-emerald-500',
    icon: 'fas fa-heart',
    permissions: ['users:view', 'analytics:customers', 'orders:view']
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

  logistics_coordinator: {
    role: 'logistics_coordinator',
    name: 'Coordinador Logístico',
    description: 'Gestión de envíos y logística',
    level: 6,
    color: 'bg-orange-500',
    icon: 'fas fa-truck',
    permissions: ['orders:logistics', 'inventory:logistics', 'analytics:logistics']
  },

  qa_specialist: {
    role: 'qa_specialist',
    name: 'Especialista en Calidad',
    description: 'Control de calidad',
    level: 6,
    color: 'bg-red-500',
    icon: 'fas fa-check-circle',
    permissions: ['products:qa', 'orders:qa', 'analytics:quality']
  },

  // VENDEDORES
  seller_premium: {
    role: 'seller_premium',
    name: 'Vendedor Premium',
    description: 'Vendedor de alto volumen',
    level: 7,
    color: 'bg-amber-600',
    icon: 'fas fa-store',
    permissions: ['products:create', 'products:update', 'analytics:sales', 'orders:view', 'promotions:seller']
  },

  seller_standard: {
    role: 'seller_standard',
    name: 'Vendedor Estándar',
    description: 'Vendedor con funciones básicas',
    level: 8,
    color: 'bg-yellow-500',
    icon: 'fas fa-shopping-bag',
    permissions: ['products:update', 'analytics:basic', 'orders:view']
  },

  seller_basic: {
    role: 'seller_basic',
    name: 'Vendedor Básico',
    description: 'Vendedor con acceso limitado',
    level: 9,
    color: 'bg-gray-400',
    icon: 'fas fa-cash-register',
    permissions: ['products:read', 'orders:basic']
  },

  // CLIENTES
  cliente: {
    role: 'cliente',
    name: 'Cliente',
    description: 'Cliente regular del e-commerce',
    level: 10,
    color: 'bg-blue-500',
    icon: 'fas fa-user',
    permissions: ['orders:view', 'products:view', 'cart:manage', 'profile:edit']
  },

  guest: {
    role: 'guest',
    name: 'Invitado',
    description: 'Usuario no registrado',
    level: 13,
    color: 'bg-gray-300',
    icon: 'fas fa-user-circle',
    permissions: ['products:public']
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