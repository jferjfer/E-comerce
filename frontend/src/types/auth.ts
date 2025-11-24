export type UserRole = 
  | 'ceo' | 'cfo' | 'cmo' 
  | 'operations_director' | 'tech_director' | 'regional_manager'
  | 'category_manager' | 'brand_manager' | 'inventory_manager' | 'marketing_manager'
  | 'product_manager' | 'pricing_analyst' | 'content_editor' | 'visual_merchandiser'
  | 'photographer' | 'customer_success' | 'support_agent' | 'logistics_coordinator'
  | 'qa_specialist' | 'seller_premium' | 'seller_standard' | 'seller_basic'
  | 'vip_customer' | 'premium_customer' | 'regular_customer' | 'guest'

export type Permission = 
  | 'products:create' | 'products:read' | 'products:update' | 'products:delete' | 'products:publish'
  | 'promotions:create' | 'promotions:read' | 'promotions:update' | 'promotions:approve'
  | 'pricing:view' | 'pricing:edit' | 'pricing:approve'
  | 'analytics:sales' | 'analytics:profit' | 'analytics:customers' | 'analytics:inventory'
  | 'orders:view' | 'orders:process' | 'orders:refund'
  | 'users:view' | 'users:edit' | 'users:delete'
  | 'inventory:view' | 'inventory:manage' | 'inventory:transfer'
  | 'content:edit' | 'content:publish' | 'content:translate'
  | 'system:config' | 'system:backup' | 'system:logs'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  roles: UserRole[]
  permissions: Permission[]
  organizationId: string
  regionId?: string
  categoryIds?: string[]
  brandIds?: string[]
  isActive: boolean
  lastLogin: Date
  createdAt: Date
}

export interface RoleDefinition {
  role: UserRole
  name: string
  description: string
  level: number
  permissions: Permission[]
  color: string
  icon: string
}