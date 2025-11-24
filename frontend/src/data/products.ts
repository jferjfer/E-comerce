import { Product, PaymentMethod } from '@/types'

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Vestido Profesional IA',
    price: 89900,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
    description: 'Vestido elegante perfecto para el trabajo. Confeccionado en algodón orgánico de alta calidad.',
    category: 'Vestidos',
    size: ['XS', 'S', 'M', 'L', 'XL'],
    color: ['Negro', 'Azul marino', 'Gris'],
    rating: 5,
    inStock: true,
    isEco: true,
    compatibility: 98
  },
  {
    id: '2',
    name: 'Camisa Casual IA',
    price: 47900,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    description: 'Camisa cómoda de lino sostenible, ideal para el día a día. Diseño versátil y fresco.',
    category: 'Camisas',
    size: ['S', 'M', 'L', 'XL'],
    color: ['Blanco', 'Beige', 'Azul claro'],
    rating: 4,
    inStock: true,
    isEco: true,
    compatibility: 95
  },
  {
    id: '3',
    name: 'Pantalón Versátil',
    price: 79900,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
    description: 'Pantalón de denim reciclado que combina con todo tu guardarropa. Corte moderno y cómodo.',
    category: 'Pantalones',
    size: ['28', '30', '32', '34', '36'],
    color: ['Azul', 'Negro', 'Gris'],
    rating: 5,
    inStock: true,
    isEco: true,
    compatibility: 92
  },
  {
    id: '4',
    name: 'Blazer Inteligente IA',
    price: 129900,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop',
    description: 'Blazer premium de lana merino. Perfecto para completar tu look profesional con elegancia.',
    category: 'Blazers',
    size: ['S', 'M', 'L', 'XL'],
    color: ['Negro', 'Gris oscuro', 'Azul marino'],
    rating: 5,
    inStock: true,
    compatibility: 96
  }
]

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Pago de Contado',
    type: 'cash',
    description: 'Tarjeta, PSE, Nequi, Efectivo',
    icon: 'fas fa-credit-card'
  },
  {
    id: 'internal',
    name: 'Crédito StyleHub',
    type: 'credit',
    description: 'Financiación hasta 12 meses sin intereses',
    icon: 'fas fa-store'
  },
  {
    id: 'addi',
    name: 'ADDI',
    type: 'external',
    description: 'Préstamo instantáneo hasta $5.000.000',
    icon: 'fas fa-circle',
    maxAmount: 5000000,
    interestRate: 1.5
  },
  {
    id: 'sistecredito',
    name: 'Sistecredito',
    type: 'external',
    description: 'Préstamos personales hasta $10.000.000',
    icon: 'fas fa-university',
    maxAmount: 10000000,
    interestRate: 1.2
  }
]