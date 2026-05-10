import { MetodoPago } from '@/types'

export const metodosPago: MetodoPago[] = [
  {
    id: 'pago_en_linea',
    nombre: 'Tarjeta de crédito / débito',
    tipo: 'externo',
    descripcion: 'Visa, Mastercard, Amex, Diners — procesado por ePayco',
    icono: 'fas fa-credit-card'
  },
  {
    id: 'pse',
    nombre: 'PSE — Débito bancario',
    tipo: 'externo',
    descripcion: 'Paga directamente desde tu cuenta bancaria colombiana',
    icono: 'fas fa-university'
  },
  {
    id: 'nequi',
    nombre: 'Nequi',
    tipo: 'externo',
    descripcion: 'Paga desde tu billetera Nequi',
    icono: 'fas fa-mobile-alt'
  },
  {
    id: 'daviplata',
    nombre: 'Daviplata',
    tipo: 'externo',
    descripcion: 'Paga desde tu billetera Daviplata',
    icono: 'fas fa-wallet'
  },
  {
    id: 'efectivo',
    nombre: 'Efectivo',
    tipo: 'externo',
    descripcion: 'Paga en Efecty o Baloto con el código que te generamos',
    icono: 'fas fa-money-bill-wave'
  },
  {
    id: 'credito_interno',
    nombre: 'Obtenlo a cuotas',
    tipo: 'credito',
    descripcion: 'Crédito propio EGOS — paga en 3, 6 o 12 cuotas mensuales',
    icono: 'fas fa-hand-holding-usd',
    tasa_interes: 2.5
  }
]
