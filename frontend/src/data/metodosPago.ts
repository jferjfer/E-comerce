import { MetodoPago } from '@/types'

export const metodosPago: MetodoPago[] = [
  {
    id: 'pago_en_linea',
    nombre: 'Pagar en línea',
    tipo: 'externo',
    descripcion: 'Tarjeta, PSE, Nequi, Daviplata, Efecty — procesado por ePayco',
    icono: 'fas fa-credit-card'
  }
]
