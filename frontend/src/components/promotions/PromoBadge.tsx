interface PromoBadgeProps {
  text: string
  type?: 'sale' | 'new' | 'hot' | 'limited' | 'free_shipping'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export default function PromoBadge({ text, type = 'sale', size = 'md', animated = false }: PromoBadgeProps) {
  const getStyles = () => {
    const baseStyles = 'font-bold rounded-full flex items-center justify-center'
    
    const sizeStyles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-2 text-base'
    }
    
    const typeStyles = {
      sale: 'bg-red-500 text-white',
      new: 'bg-green-500 text-white',
      hot: 'bg-orange-500 text-white',
      limited: 'bg-purple-500 text-white',
      free_shipping: 'bg-blue-500 text-white'
    }
    
    const animationStyles = animated ? 'animate-pulse' : ''
    
    return `${baseStyles} ${sizeStyles[size]} ${typeStyles[type]} ${animationStyles}`
  }
  
  const getIcon = () => {
    switch (type) {
      case 'sale': return 'fas fa-percentage'
      case 'new': return 'fas fa-star'
      case 'hot': return 'fas fa-fire'
      case 'limited': return 'fas fa-clock'
      case 'free_shipping': return 'fas fa-truck'
      default: return 'fas fa-tag'
    }
  }
  
  return (
    <span className={getStyles()}>
      <i className={`${getIcon()} mr-1`}></i>
      {text}
    </span>
  )
}