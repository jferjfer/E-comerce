import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatPrice } from '@/utils/sanitize'

export default function EpaycoRespuestaPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState<'cargando' | 'exitoso' | 'pendiente' | 'fallido'>('cargando')

  const x_response = params.get('x_response') || ''
  const x_ref_payco = params.get('x_ref_payco') || ''
  const x_amount = params.get('x_amount') || '0'
  const x_id_invoice = params.get('x_id_invoice') || ''
  const x_response_reason_text = params.get('x_response_reason_text') || ''

  useEffect(() => {
    if (x_response === 'Aceptada') setEstado('exitoso')
    else if (x_response === 'Pendiente') setEstado('pendiente')
    else setEstado('fallido')
  }, [x_response])

  const config = {
    exitoso: {
      icon: 'fa-check-circle',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 border-emerald-200',
      titulo: '¡Pago exitoso!',
      mensaje: 'Tu pago fue procesado correctamente. Recibirás un correo de confirmación.'
    },
    pendiente: {
      icon: 'fa-clock',
      color: 'text-amber-500',
      bg: 'bg-amber-50 border-amber-200',
      titulo: 'Pago pendiente',
      mensaje: 'Tu pago está siendo procesado. Te notificaremos cuando sea confirmado.'
    },
    fallido: {
      icon: 'fa-times-circle',
      color: 'text-red-500',
      bg: 'bg-red-50 border-red-200',
      titulo: 'Pago no completado',
      mensaje: x_response_reason_text || 'El pago no pudo ser procesado. Intenta de nuevo.'
    },
    cargando: {
      icon: 'fa-circle-notch fa-spin',
      color: 'text-gray-400',
      bg: 'bg-gray-50 border-gray-200',
      titulo: 'Procesando...',
      mensaje: 'Verificando el estado de tu pago.'
    }
  }

  const c = config[estado]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">

        {/* Icono */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${c.bg}`}>
          <i className={`fas ${c.icon} text-3xl ${c.color}`}></i>
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{c.titulo}</h2>
          <p className="text-gray-500 mt-2 text-sm">{c.mensaje}</p>
        </div>

        {/* Detalles */}
        {x_id_invoice && (
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 border border-gray-100">
            {x_id_invoice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pedido</span>
                <span className="font-mono font-bold text-gray-800">#{x_id_invoice}</span>
              </div>
            )}
            {parseFloat(x_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total pagado</span>
                <span className="font-bold text-gray-800">{formatPrice(parseFloat(x_amount))}</span>
              </div>
            )}
            {x_ref_payco && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Referencia ePayco</span>
                <span className="font-mono text-xs text-gray-600">{x_ref_payco}</span>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-shopping-bag mr-2"></i>
            Ver mis pedidos
          </button>
          {estado === 'fallido' && (
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Volver a la tienda
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
