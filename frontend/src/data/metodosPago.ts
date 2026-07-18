import { MetodoPago } from '@/types'

export const SISTECREDITO_LOGO = 'https://importaexpertos.com/compras/img/cms/logo-sistecredito-transparente.png'
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
    nombre: 'Sistecredito — Paga a cuotas',
    tipo: 'externo',
    descripcion: 'Financia tu compra en cuotas sin tarjeta de crédito',
    icono: 'fas fa-hand-holding-usd'
  },
  {
    id: 'addi',
    nombre: 'ADDI — Compra ahora, paga después',
    tipo: 'externo',
    descripcion: 'Paga en cuotas quincenales sin tarjeta de crédito',
    icono: 'fas fa-calendar-alt'
  }
]
