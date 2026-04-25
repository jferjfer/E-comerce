import { MetodoPago } from '@/types'

export const metodosPago: MetodoPago[] = [
  {
    id: 'pago_en_linea',
    nombre: 'Tarjeta de crédito / débito',
    tipo: 'externo',
    descripcion: 'Visa, Mastercard, Amex — procesado por ePayco',
    icono: 'fas fa-credit-card'
  },
  {
    id: 'pse',
    nombre: 'PSE — Débito bancario',
    tipo: 'externo',
    descripcion: 'Paga directamente desde tu cuenta bancaria colombiana (Breve)',
    icono: 'fas fa-university'
  },
  {
    id: 'credito_interno',
    nombre: 'Obtenlo a cuotas',
    tipo: 'credito',
    descripcion: 'Crédito propio EGOS — paga en 3, 6 o 12 cuotas mensuales',
    icono: 'fas fa-hand-holding-usd',
    tasa_interes: 2.5
  },
  {
    id: 'efectivo',
    nombre: 'Efectivo',
    tipo: 'contado',
    descripcion: 'Genera un código y paga en Efecty o Baloto',
    icono: 'fas fa-money-bill-wave'
  }
]
