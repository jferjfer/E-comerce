export interface Promotion {
  id: string
  name: string
  description: string
  type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping'
  value: number
  minAmount?: number
  maxDiscount?: number
  startDate: Date
  endDate: Date
  isActive: boolean
  categoryIds?: string[]
  productIds?: string[]
  userRoles?: string[]
  usageLimit?: number
  usageCount: number
  code?: string
  badge?: {
    text: string
    color: string
    bgColor: string
  }
}

export interface Promotion extends Promotion {
  createdBy: string
  createdAt: Date
  updatedAt: Date
}