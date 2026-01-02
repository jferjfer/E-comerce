export type UserRole = 
  | 'ceo' | 'cfo' | 'cmo' | 'cliente'
  | 'operations_director' | 'tech_director' | 'regional_manager'
  | 'category_manager' | 'brand_manager' | 'inventory_manager' | 'marketing_manager'
  | 'product_manager' | 'pricing_analyst' | 'content_editor' | 'visual_merchandiser'
  | 'photographer' | 'customer_success' | 'support_agent' | 'logistics_coordinator'
  | 'qa_specialist' | 'seller_premium' | 'seller_standard' | 'seller_basic'
  | 'guest'

export type RoleType = UserRole;

export type Permission = 
  | '*'
  | 'products:create' | 'products:read' | 'products:update' | 'products:delete' | 'products:publish'
  | 'products:brand' | 'products:visual' | 'products:images' | 'products:qa'
  | 'products:view' | 'products:exclusive' | 'products:early_access' | 'products:standard' | 'products:public'
  | 'promotions:create' | 'promotions:read' | 'products:update' | 'promotions:approve'
  | 'promotions:brand' | 'promotions:seller' | 'promotions:update'
  | 'pricing:view' | 'pricing:edit' | 'pricing:approve'
  | 'analytics:sales' | 'analytics:profit' | 'analytics:customers' | 'analytics:inventory'
  | 'analytics:operations' | 'analytics:technical' | 'analytics:regional' | 'analytics:brand'
  | 'analytics:marketing' | 'analytics:pricing' | 'analytics:visual' | 'analytics:logistics'
  | 'analytics:quality' | 'analytics:basic'
  | 'orders:view' | 'orders:process' | 'orders:refund' | 'orders:regional' | 'orders:inventory'
  | 'orders:logistics' | 'orders:qa' | 'orders:vip' | 'orders:premium' | 'orders:basic'
  | 'users:view' | 'users:edit' | 'users:delete' | 'users:manage' | 'users:regional'
  | 'inventory:view' | 'inventory:manage' | 'inventory:transfer' | 'inventory:regional' | 'inventory:logistics'
  | 'content:edit' | 'content:publish' | 'content:translate' | 'content:brand' | 'content:marketing'
  | 'content:visual' | 'content:images'
  | 'system:config' | 'system:backup' | 'system:logs'
  | 'operations:manage'
  | 'cart:manage' | 'profile:edit'
  | 'support:priority' | 'support:enhanced'

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