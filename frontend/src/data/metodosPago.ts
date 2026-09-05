import { MetodoPago } from '@/types'

export const SISTECREDITO_LOGO = '/sistecredito-logo.png'
export const ADDI_LOGO = '/addi-logo.svg'

export const metodosPago: MetodoPago[] = [
  {
    id: 'pago_en_linea',
    nombre: 'Pagar en línea',
    tipo: 'externo',
    descripcion: 'Tarjeta, PSE, Nequi, Daviplata, Efecty — procesado por ePayco',
    icono: 'fas fa-credit-card'
  },
  {
    id: 'sistecredito',
    nombre: 'Sistecredito',
    tipo: 'externo',
    descripcion: 'Crédito inmediato para tu compra',
    icono: 'fas fa-hand-holding-usd'
  },
  {
    id: 'addi',
    nombre: 'ADDI',
    tipo: 'externo',
    descripcion: 'Compra hoy, paga después sin tarjeta',
    icono: 'fas fa-calendar-alt'
  }
]
