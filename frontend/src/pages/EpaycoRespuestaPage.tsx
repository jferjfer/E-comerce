import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatPrice } from '@/utils/sanitize'
import { API_URL } from '@/config/api'
import { useAuthStore } from '@/store/useAuthStore'

export default function EpaycoRespuestaPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [estado, setEstado] = useState<'cargando' | 'exitoso' | 'pendiente' | 'fallido'>('cargando')
  const [detalle, setDetalle] = useState('')

  // Parámetros que envía ePayco
  const x_response          = params.get('x_response') || ''
  const x_ref_payco         = params.get('x_ref_payco') || ''
  const x_amount            = params.get('x_amount') || '0'
  const x_id_invoice        = params.get('x_id_invoice') || params.get('x_extra1') || ''
  const x_response_reason   = params.get('x_response_reason_text') || ''
  const x_cod_response      = params.get('x_cod_response') || params.get('x_response_code_transaction') || ''

  useEffect(() => {
    // Log para debug
    const todosParams = Object.fromEntries(params.entries())
    console.log('ePayco respuesta URL completa:', window.location.href)
    console.log('ePayco respuesta params:', todosParams)

    // Si no hay ningún parámetro de ePayco
    if (Object.keys(todosParams).length === 0) {
      // Llegamos sin parámetros — consultar último pedido
      if (token) {
        consultarUltimoPedido()
      } else {
        setEstado('exitoso')
        setDetalle('Tu pedido fue creado. Revisa tus pedidos.')
      }
      return
    }

    // ePayco envió parámetros
    if (x_response === 'Aceptada' || x_cod_response === '1') {
      setEstado('exitoso')
      setDetalle('Tu pago fue procesado correctamente.')
    } else if (x_response === 'Pendiente' || x_cod_response === '3' || x_cod_response === '7') {
      setEstado('pendiente')
      setDetalle('Tu pago está siendo validado. Te notificaremos pronto.')
    } else if (x_response === 'Rechazada' || x_response === 'Fallida' || x_cod_response === '2' || x_cod_response === '4' || x_cod_response === '6') {
      setEstado('fallido')
      setDetalle(x_response_reason || `Pago ${x_response.toLowerCase()} — intenta con otro método de pago`)
    } else if (x_response) {
      // Cualquier otro valor de x_response no reconocido
      setEstado('fallido')
      setDetalle(x_response_reason || 'El pago no fue completado')
    } else {
      // Hay parámetros pero sin x_response — consultar pedido
      if (token && x_id_invoice) {
        consultarEstadoPedido(x_id_invoice)
      } else if (token) {
        consultarUltimoPedido()
      } else {
        setEstado('exitoso')
      }
    }
  }, [x_response, x_cod_response])

  const consultarEstadoPedido = async (pedidoId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/pedidos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const pedido = data.pedidos?.find((p: any) => p.id === pedidoId)
      if (pedido) {
        if (pedido.estado === 'Confirmado' || pedido.estado === 'Enviado' || pedido.estado === 'Entregado') {
          setEstado('exitoso')
        } else if (pedido.estado === 'Creado') {
          setEstado('pendiente')
          setDetalle('Tu pedido fue creado. El pago está siendo procesado.')
        } else {
          setEstado('fallido')
        }
      } else {
        setEstado('exitoso')
      }
    } catch {
      setEstado('exitoso')
    }
  }

  const consultarUltimoPedido = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pedidos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const ultimo = data.pedidos?.[0]
      if (ultimo) {
        if (ultimo.estado === 'Confirmado' || ultimo.estado === 'Enviado') {
          setEstado('exitoso')
        } else {
          setEstado('pendiente')
          setDetalle('Tu pedido fue creado. El pago está siendo procesado.')
        }
      } else {
        setEstado('exitoso')
      }
    } catch {
      setEstado('exitoso')
    }
  }

  const config = {
    exitoso: {
      icon: 'fa-check-circle',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 border-emerald-200',
      titulo: '¡Pago exitoso!',
      mensaje: detalle || 'Tu pago fue procesado correctamente. Recibirás un correo de confirmación.'
    },
    pendiente: {
      icon: 'fa-clock',
      color: 'text-amber-500',
      bg: 'bg-amber-50 border-amber-200',
      titulo: 'Pago en proceso',
      mensaje: detalle || 'Tu pago está siendo validado. Te notificaremos cuando sea confirmado.'
    },
    fallido: {
      icon: 'fa-times-circle',
      color: 'text-red-500',
      bg: 'bg-red-50 border-red-200',
      titulo: 'Pago rechazado',
      mensaje: detalle || x_response_reason || 'El pago no pudo ser procesado. Intenta con otro método.'
    },
    cargando: {
      icon: 'fa-circle-notch fa-spin',
      color: 'text-gray-400',
      bg: 'bg-gray-50 border-gray-200',
      titulo: 'Verificando pago...',
      mensaje: 'Por favor espera un momento.'
    }
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
          <p className="text-gray-500 mt-2 text-sm">{c.mensaje}</p>
        </div>

        {(x_id_invoice || x_ref_payco) && (
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 border border-gray-100">
            {x_id_invoice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pedido</span>
                <span className="font-mono font-bold text-gray-800">#{x_id_invoice}</span>
              </div>
            )}
            {parseFloat(x_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-800">{formatPrice(parseFloat(x_amount))}</span>
              </div>
            )}
            {x_ref_payco && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ref. ePayco</span>
                <span className="font-mono text-xs text-gray-600">{x_ref_payco}</span>
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
            {estado === 'fallido' ? 'Volver a la tienda' : 'Seguir comprando'}
          </button>
        </div>
      </div>
    </div>
  )
}
