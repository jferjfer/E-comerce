import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '@/config/api'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { formatPrice } from '@/utils/sanitize'
import { api } from '@/services/api'
import Modal from './Modal'
import CheckoutSteps from './checkout/CheckoutSteps'
import PaymentMethodStep from './checkout/PaymentMethodStep'
import ConfirmationStep from './checkout/ConfirmationStep'
import SuccessStep from './checkout/SuccessStep'
import EpaycoWidget from './checkout/EpaycoWidget'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const navigate = useNavigate()
  const { items, obtenerPrecioTotal, vaciarCarrito } = useCartStore()
  const { usuario, token, estaAutenticado } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [plazoCredito, setPlazoCredito] = useState<number | undefined>()

  // Evaluación de crédito
  const [evaluacionCredito, setEvaluacionCredito] = useState<any>(null)
  const [cargandoCredito, setCargandoCredito] = useState(false)
  const [creditoId, setCreditoId] = useState<string | null>(null)
  const [epaycoActivo, setEpaycoActivo] = useState(false)
  const [pedidoParaEpayco, setPedidoParaEpayco] = useState<string | null>(null)
  const [codigoBonoParaEpayco, setCodigoBonoParaEpayco] = useState<string | null>(null)

  const total = obtenerPrecioTotal()
  const [montoBono, setMontoBono] = useState(0)
  const [totalParaEpayco, setTotalParaEpayco] = useState(0)
  const totalConBono = Math.max(0, total - montoBono)

  // Al abrir, evaluar crédito y verificar si ePayco está activo
  useEffect(() => {
    if (isOpen && estaAutenticado && usuario?.rol === 'cliente' && token) {
      setCargandoCredito(true)
      api.evaluarCredito(token, usuario)
        .then(data => setEvaluacionCredito(data))
        .catch(() => setEvaluacionCredito({ califica: false }))
        .finally(() => setCargandoCredito(false))

      // Verificar si ePayco está configurado
      fetch(`${API_URL}/api/pagos/epayco/estado`)
        .then(r => r.json())
        .then(d => setEpaycoActivo(d.configurado))
        .catch(() => setEpaycoActivo(false))
    }
  }, [isOpen, estaAutenticado, usuario, token])

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1)
      setSelectedMethod('')
      setError(null)
      setOrderId(null)
      setPlazoCredito(undefined)
      setCreditoId(null)
      setPedidoParaEpayco(null)
      setCodigoBonoParaEpayco(null)
      setMontoBono(0)
      setTotalParaEpayco(0)
    }
  }, [isOpen])

  // Prompt login
  if (isOpen && !estaAutenticado) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <i className="fas fa-user-lock text-gray-500 text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Inicia sesión para continuar</h3>
            <p className="text-sm text-gray-500 mt-1">Necesitas una cuenta para completar tu compra</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={() => { onClose(); navigate('/login') }} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  const processPayment = async (plazo?: number, codigoBono?: string) => {
    if (!token || !usuario) return
    if (usuario.rol !== 'cliente') {
      setError('Solo los clientes pueden realizar compras')
      return
    }

    setIsLoading(true)
    setError(null)
    setPlazoCredito(plazo)

    try {
      // 1. Obtener monto del bono PRIMERO antes de cualquier otra cosa
      let montoBonoPedido = 0
      if (codigoBono) {
        const validacion = await api.validarBono(codigoBono, usuario.id)
        if (validacion.valido) {
          montoBonoPedido = validacion.monto
          setMontoBono(montoBonoPedido) // actualizar estado para UI
        } else {
          setError(validacion.razon || 'Código de bono no válido')
          setIsLoading(false)
          return
        }
      }

      const totalFinalCliente = Math.max(0, total - montoBonoPedido)

      // 2. Crear el pedido con el total ya descontado
      const resultado = await api.procesarCheckout(token, {
        metodoPago: selectedMethod,
        direccion_envio: 'Dirección predeterminada',
        descuento_bono: montoBonoPedido,
        codigo_bono: codigoBono || null,
        items: items.map(item => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad
        }))
      })

      if (!resultado.exito) {
        setError(resultado.error || 'Error al procesar el pedido')
        return
      }

      const pedidoId = resultado.orden.id

      // Todos los métodos externos van por ePayco
      if (['pago_en_linea', 'pse', 'efectivo', 'nequi', 'daviplata'].includes(selectedMethod)) {
        if (epaycoActivo) {
          // totalFinalCliente ya calculado arriba con el descuento del bono
          setTotalParaEpayco(totalFinalCliente)
          setPedidoParaEpayco(pedidoId)
          setCodigoBonoParaEpayco(codigoBono || null)
          setIsLoading(false)
          return
        } else {
          setError('La pasarela de pagos no está disponible en este momento. Por favor elige crédito EGOS.')
          setIsLoading(false)
          return
        }
      }

      // 2. Aplicar bono SOLO si el pago es exitoso (no ePayco)
      // Para ePayco el bono se aplica en onExito
      if (codigoBono) {
        const resultadoBono = await api.aplicarBono(codigoBono, usuario.id, pedidoId)
        if (resultadoBono.error) {
          setError('El código de bono no es válido o ya fue utilizado')
          return
        }
      }

      // 3. Si es crédito interno: solicitar crédito y hacer cargo
      if (selectedMethod === 'credito_interno' && plazo) {
        const montoFinal = codigoBono && evaluacionCredito?.monto_bono
          ? Math.max(0, total - evaluacionCredito.monto_bono)
          : total

        const solicitud = await api.solicitarCreditoInterno(token, usuario.id, montoFinal, plazo)

        if (!solicitud.aprobado) {
          setError(solicitud.razon || 'No se pudo aprobar el crédito')
          return
        }

        const cargo = await api.cargarCredito(token, solicitud.credito_id, pedidoId, montoFinal)
        if (cargo.error) {
          setError('Error al aplicar el crédito')
          return
        }

        setCreditoId(solicitud.credito_id)
      }

      // 4. Éxito
      setOrderId(pedidoId)
      setCurrentStep(3)
      vaciarCarrito()

    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentStep(1)
    setSelectedMethod('')
    setOrderId(null)
    setError(null)
    setPlazoCredito(undefined)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 3 ? handleClose : onClose}
      title={currentStep === 3 ? '' : 'Finalizar compra'}
      size="md"
    >
      <div className="space-y-5">

        {/* Indicador de pasos (solo en pasos 1 y 2) */}
        {currentStep < 3 && (
          <>
            <CheckoutSteps currentStep={currentStep} totalSteps={2} />

            {/* Resumen total */}
            <div className="flex justify-between items-center px-1">
              <span className="text-sm text-gray-500">
                <i className="fas fa-shopping-bag mr-1.5"></i>
                {items.length} producto(s)
              </span>
              <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <i className="fas fa-exclamation-circle flex-shrink-0 mt-0.5"></i>
            <div>
              <p className="font-semibold mb-0.5">No se pudo completar el pago</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Paso 1: Método de pago */}
        {currentStep === 1 && (
          <PaymentMethodStep
            selectedMethod={selectedMethod}
            onMethodSelect={(id) => { setSelectedMethod(id); setError(null) }}
            onNext={() => setCurrentStep(2)}
            evaluacionCredito={evaluacionCredito}
            cargandoCredito={cargandoCredito}
          />
        )}

        {currentStep === 2 && (
          <>
            <ConfirmationStep
              selectedMethod={selectedMethod}
              isLoading={isLoading}
              onConfirm={processPayment}
              onBack={() => setCurrentStep(1)}
              limiteCredito={evaluacionCredito?.limite_aprobado}
            />
            {/* Widget ePayco — aparece después de crear el pedido */}
            {pedidoParaEpayco && ['pago_en_linea','pse','efectivo','nequi','daviplata'].includes(selectedMethod) && token && (
              <div className="mt-4 space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                  <i className="fas fa-check-circle text-blue-500 mr-1"></i>
                  Pedido <strong>#{pedidoParaEpayco}</strong> creado. Completa el pago:
                </div>
                <EpaycoWidget
                  pedidoId={pedidoParaEpayco}
                  total={totalParaEpayco || totalConBono}
                  token={token}
                  metodoPago={selectedMethod}
                  onExito={async () => {
                    // Aplicar bono AHORA que el pago ePayco fue exitoso
                    if (codigoBonoParaEpayco && usuario) {
                      await api.aplicarBono(codigoBonoParaEpayco, usuario.id, pedidoParaEpayco!)
                    }
                    setOrderId(pedidoParaEpayco)
                    setPedidoParaEpayco(null)
                    setCodigoBonoParaEpayco(null)
                    setCurrentStep(3)
                    vaciarCarrito()
                  }}
                  onError={(msg) => setError(msg)}
                  onCancelado={() => {
                    setError('Pago cancelado. Puedes intentarlo de nuevo.')
                    setPedidoParaEpayco(null)
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Paso 3: Éxito */}
        {currentStep === 3 && (
          <SuccessStep
            orderId={orderId}
            onClose={handleClose}
            metodoPago={selectedMethod}
            cuotaMensual={plazoCredito ? Math.ceil(total / plazoCredito) : undefined}
            plazo={plazoCredito}
          />
        )}
      </div>
    </Modal>
  )
}
