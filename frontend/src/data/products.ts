import { Producto, MetodoPago } from '@/types'

export const productosSimulados: Producto[] = [
  {
    id: '1',
    nombre: 'Vestido Profesional IA',
    precio: 89900,
    imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
    descripcion: 'Vestido elegante perfecto para el trabajo. Confeccionado en algodón orgánico de alta calidad.',
    categoria: 'Vestidos',
    tallas: ['XS', 'S', 'M', 'L', 'XL'],
    colores: ['Negro', 'Azul marino', 'Gris'],
    calificacion: 5,
    en_stock: true,
    es_eco: true,
    compatibilidad: 98
  },
  {
    id: '2',
    nombre: 'Camisa Casual IA',
    precio: 47900,
    imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
    descripcion: 'Camisa cómoda de lino sostenible, ideal para el día a día. Diseño versátil y fresco.',
    categoria: 'Camisas',
    tallas: ['S', 'M', 'L', 'XL'],
    colores: ['Blanco', 'Beige', 'Azul claro'],
    calificacion: 4,
    en_stock: true,
    es_eco: true,
    compatibilidad: 95
  },
  {
    id: '3',
    nombre: 'Pantalón Versátil',
    precio: 79900,
    imagen: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
    descripcion: 'Pantalón de denim reciclado que combina con todo tu guardarropa. Corte moderno y cómodo.',
    categoria: 'Pantalones',
    tallas: ['28', '30', '32', '34', '36'],
    colores: ['Azul', 'Negro', 'Gris'],
    calificacion: 5,
    en_stock: true,
    es_eco: true,
    compatibilidad: 92
  },
  {
    id: '4',
    nombre: 'Blazer Inteligente IA',
    precio: 129900,
    imagen: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop',
    descripcion: 'Blazer premium de lana merino. Perfecto para completar tu look profesional con elegancia.',
    categoria: 'Blazers',
    tallas: ['S', 'M', 'L', 'XL'],
    colores: ['Negro', 'Gris oscuro', 'Azul marino'],
    calificacion: 5,
    en_stock: true,
    compatibilidad: 96
  }
]

export const metodosPago: MetodoPago[] = [
  {
    id: 'contado',
    nombre: 'Pago de Contado',
    tipo: 'contado',
    descripcion: 'Tarjeta, PSE, Nequi, Efectivo',
    icono: 'fas fa-credit-card'
  },
  {
    id: 'interno',
    nombre: 'Crédito StyleHub',
    tipo: 'credito',
    descripcion: 'Financiación hasta 12 meses sin intereses',
    icono: 'fas fa-store'
  },
  {
    id: 'addi',
    nombre: 'ADDI',
    tipo: 'externo',
    descripcion: 'Préstamo instantáneo hasta $5.000.000',
    icono: 'fas fa-circle',
    monto_maximo: 5000000,
    tasa_interes: 1.5
  },
  {
    id: 'sistecredito',
    nombre: 'Sistecredito',
    tipo: 'externo',
    descripcion: 'Préstamos personales hasta $10.000.000',
    icono: 'fas fa-university',
    monto_maximo: 10000000,
    tasa_interes: 1.2
  }
]