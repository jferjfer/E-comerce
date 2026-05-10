/**
 * ePayco Widget Component
 * 
 * Carga el script de ePayco y abre el widget de pago embebido.
 * Cuando ePayco esté configurado, este componente reemplaza la simulación actual.
 * 
 * Documentación: https://docs.epayco.co/tools/checkout
 */

import { useEffect, useRef, useState } from 'react'
import { API_URL } from '@/config/api'

interface EpaycoWidgetProps {
  pedidoId: string
  total: number
  token: string
  metodoPago?: string
  onExito: () => void
  onError: (mensaje: string) => void
  onCancelado: () => void
}

declare global {
  interface Window {
    ePayco?: {
      checkout: {
        configure: (config: any) => { open: (data: any) => void }
      }
    }
  }
}

export default function EpaycoWidget({ pedidoId, total, token, metodoPago, onExito, onError, onCancelado }: EpaycoWidgetProps) {
  const [cargando, setCargando] = useState(false)
  const [scriptCargado, setScriptCargado] = useState(false)
  const handlerRef = useRef<any>(null)

  // Cargar script de ePayco
  useEffect(() => {
    if (document.getElementById('epayco-script')) {
      setScriptCargado(true)
      return
    }

    const script = document.createElement('script')
    script.id = 'epayco-script'
    script.src = 'https://checkout.epayco.co/checkout.js'
    script.async = true
    script.onload = () => setScriptCargado(true)
    script.onerror = () => onError('No se pudo cargar la pasarela de pagos')
    document.head.appendChild(script)

    return () => {
      // No eliminar el script al desmontar para evitar recarga
    }
  }, [])

  // Escuchar respuesta de ePayco via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://checkout.epayco.co') return

      const { data } = event
      if (!data) return

      console.log('📩 Respuesta ePayco:', data)

      const motivo = data.x_response_reason_text || ''
      const codigo = String(data.x_response_code_transaction || '')

      if (data.x_response === 'Aceptada' || codigo === '1') {
        onExito()
      } else if (data.x_response === 'Cancelada') {
        onCancelado()
      } else if (data.x_response === 'Pendiente' || codigo === '3' || codigo === '7') {
        onError(`Tu pago está pendiente de confirmación. ${motivo ? motivo + '.' : 'Recibirás un correo cuando sea aprobado.'}`)
      } else if (data.x_response === 'Rechazada' || codigo === '2') {
        const mensajeRechazo = motivo || 'Pago rechazado'
        onError(`Pago rechazado: ${mensajeRechazo}. Verifica los datos de tu tarjeta o intenta con otro método.`)
      } else if (data.x_response === 'Fallida' || codigo === '4') {
        const mensajeFalla = motivo || 'Error en la transacción'
        onError(`Pago fallido: ${mensajeFalla}. Intenta de nuevo o usa otro método de pago.`)
      } else if (codigo === '6') {
        onError(`Pago reversado: ${motivo || 'La transacción fue reversada'}. Contacta a tu banco si tienes dudas.`)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onExito, onError, onCancelado])

  const abrirWidget = async () => {
    if (!scriptCargado || !window.ePayco) {
      onError('La pasarela de pagos no está disponible. Intenta de nuevo.')
      return
    }

    setCargando(true)

    try {
      // Obtener datos del widget desde el backend
      const res = await fetch(`${API_URL}/api/pagos/epayco/widget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pedido_id: pedidoId })
      })

      const data = await res.json()

      if (!res.ok) {
        onError(data.mensaje || data.error || 'Error iniciando pago')
        return
      }

      const { datos_widget } = data

      if (!window.ePayco) {
        onError('El widget de ePayco no cargó correctamente. Recarga la página.')
        return
      }

      // Configurar y abrir el widget de ePayco
      const handler = window.ePayco.checkout.configure({
        key: datos_widget.public_key,
        test: datos_widget.test
      })

      handlerRef.current = handler

      handler.open({
        // Datos del pago
        name:         datos_widget.name,
        description:  datos_widget.description,
        invoice:      datos_widget.invoice,
        currency:     datos_widget.currency,
        amount:       datos_widget.amount,
        tax_base:     datos_widget.tax_base,
        tax:          datos_widget.tax,
        country:      datos_widget.country,
        lang:         datos_widget.lang,

        // Preseleccionar método según elección del cliente
        ...(metodoPago === 'pse'       && { p_type_doc_billing: 'PSE',       p_type_doc: 'PSE' }),
        ...(metodoPago === 'efectivo'  && { p_type_doc_billing: 'CASH',      p_type_doc: 'CASH' }),
        ...(metodoPago === 'nequi'     && { p_type_doc_billing: 'NEQUI',     p_type_doc: 'NEQUI' }),
        ...(metodoPago === 'daviplata' && { p_type_doc_billing: 'DAVIPLATA', p_type_doc: 'DAVIPLATA' }),

        // URLs
        response:     datos_widget.response,
        confirmation: datos_widget.confirmation,

        // Cliente
        name_billing:        datos_widget.name_billing,
        address_billing:     datos_widget.address_billing,
        type_doc_billing:    datos_widget.type_doc_billing,
        mobilephone_billing: datos_widget.mobilephone_billing,
        number_doc_billing:  datos_widget.number_doc_billing,
        email_billing:       datos_widget.email_billing,

        // Extra
        extra1: datos_widget.extra1,
        extra2: datos_widget.extra2,
        extra3: datos_widget.extra3,
      })

    } catch (e) {
      onError('Error de conexión con la pasarela de pagos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <button
      onClick={abrirWidget}
      disabled={cargando || !scriptCargado}
      className="w-full py-3.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {cargando ? (
        <>
          <i className="fas fa-circle-notch fa-spin text-xs"></i>
          Cargando pasarela...
        </>
      ) : (
        <>
          <i className="fas fa-lock text-xs"></i>
          {metodoPago === 'pse' ? 'Pagar con PSE'
            : metodoPago === 'efectivo' ? 'Generar código Efecty/Baloto'
            : metodoPago === 'nequi' ? 'Pagar con Nequi'
            : metodoPago === 'daviplata' ? 'Pagar con Daviplata'
            : 'Pagar con ePayco'}
        </>
      )}
    </button>
  )
}
