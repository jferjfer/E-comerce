import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_URL } from '@/config/api'
import { useCartStore } from '@/store/useCartStore'

export default function SistecreditoRespuestaPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { vaciarCarrito } = useCartStore()
  const [estado, setEstado] = useState<'cargando' | 'exitoso' | 'pendiente' | 'fallido'>('cargando')
  const [detalle, setDetalle] = useState('')

  // Parámetros que envía Sistecredito en el redirect
  const paymentRef    = params.get('paymentRef') || ''      // _id de la pasarela
  const transactionId = params.get('transactionId') || ''   // id de Sistecredito
  const orderId       = params.get('orderId') || ''         // invoice = pedido_id

  useEffect(() => {
    if (!paymentRef && !orderId) {
      setEstado('pendiente')
      setDetalle('No se recibieron parámetros de Sistecredito. Verifica en "Mis Pedidos".')
      return
    }
    consultarEstado()
  }, [])

  const consultarEstado = async (intentos = 0) => {
    try {
      const idConsulta = paymentRef || transactionId
      if (!idConsulta) {
        setEstado('pendiente')
        setDetalle('Verifica el estado de tu pedido en "Mis Pedidos".')
        return
      }

      const res = await fetch(`${API_URL}/api/pagos/sistecredito/consultar/${idConsulta}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const tx = data?.data
      const status = tx?.transactionStatus

      if (status === 'Approved') {
        vaciarCarrito()
        setEstado('exitoso')
        setDetalle('Tu crédito fue aprobado. Recibirás un correo con el detalle de tus cuotas.')
      } else if (['Rejected', 'Cancelled', 'Expired', 'Abandoned', 'Failed'].includes(status)) {
        setEstado('fallido')
        setDetalle(tx?.paymentMethodResponse?.description || `Pago ${status?.toLowerCase()}. Intenta de nuevo.`)
      } else if (intentos < 5) {
        // Aún procesando — reintentar
        setDetalle(`Verificando pago... (${intentos + 1}/5)`)
        setTimeout(() => consultarEstado(intentos + 1), 3000)
      } else {
        setEstado('pendiente')
        setDetalle('Tu pago está siendo procesado. Recibirás un correo cuando sea confirmado.')
      }
    } catch {
      if (intentos < 3) {
        setTimeout(() => consultarEstado(intentos + 1), 3000)
      } else {
        setEstado('pendiente')
        setDetalle('Error verificando el pago. Revisa en "Mis Pedidos".')
      }
    }
  }

  const config = {
    exitoso: {
      icon: 'fa-check-circle', color: 'text-emerald-500',
      bg: 'bg-emerald-50 border-emerald-200',
      titulo: '¡Crédito aprobado!',
    },
    pendiente: {
      icon: 'fa-clock', color: 'text-amber-500',
      bg: 'bg-amber-50 border-amber-200',
      titulo: 'Pago en proceso',
    },
    fallido: {
      icon: 'fa-times-circle', color: 'text-red-500',
      bg: 'bg-red-50 border-red-200',
      titulo: 'Pago no completado',
    },
    cargando: {
      icon: 'fa-circle-notch fa-spin', color: 'text-gray-400',
      bg: 'bg-gray-50 border-gray-200',
      titulo: 'Verificando pago...',
    },
  }

  const c = config[estado]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">

        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${c.bg}`}>
          <i className={`fas ${c.icon} text-3xl ${c.color}`}></i>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">{c.titulo}</h2>
          <p className="text-gray-500 mt-2 text-sm">{detalle}</p>
        </div>

        {orderId && (
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 border border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pedido</span>
              <span className="font-mono font-bold text-gray-800">#{orderId}</span>
            </div>
            {transactionId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ref. Sistecredito</span>
                <span className="font-mono text-xs text-gray-600">{transactionId.slice(0, 16)}...</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {estado !== 'fallido' && (
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-shopping-bag mr-2"></i>
              Ver mis pedidos
            </button>
          )}
          {estado === 'fallido' && (
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-secondary transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Reintentar pago
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  )
}
