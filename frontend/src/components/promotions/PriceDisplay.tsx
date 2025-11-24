import { formatPrice } from '@/utils/sanitize'

interface PriceDisplayProps {
  originalPrice: number
  salePrice?: number
  discount?: number
  size?: 'sm' | 'md' | 'lg'
  showSavings?: boolean
}

export default function PriceDisplay({ 
  originalPrice, 
  salePrice, 
  discount, 
  size = 'md',
  showSavings = true 
}: PriceDisplayProps) {
  const finalPrice = salePrice || (discount ? originalPrice * (1 - discount / 100) : originalPrice)
  const hasDiscount = salePrice || discount
  const savings = originalPrice - finalPrice
  
  const sizeStyles = {
    sm: {
      current: 'text-lg',
      original: 'text-sm',
      savings: 'text-xs'
    },
    md: {
      current: 'text-xl',
      original: 'text-base',
      savings: 'text-sm'
    },
    lg: {
      current: 'text-3xl',
      original: 'text-xl',
      savings: 'text-base'
    }
  }
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <span className={`font-bold text-primary ${sizeStyles[size].current}`}>
          {formatPrice(finalPrice)}
        </span>
        
        {hasDiscount && (
          <span className={`text-gray-500 line-through ${sizeStyles[size].original}`}>
            {formatPrice(originalPrice)}
          </span>
        )}
        
        {discount && (
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -{discount}%
          </span>
        )}
      </div>
      
      {hasDiscount && showSavings && savings > 0 && (
        <span className={`text-green-600 font-medium ${sizeStyles[size].savings}`}>
          Ahorras {formatPrice(savings)}
        </span>
      )}
    </div>
  )
}