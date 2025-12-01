import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { formatPrice } from '@/utils/sanitize'
import { api } from '@/services/api'
import Modal from './Modal'
import CheckoutSteps from './checkout/CheckoutSteps'
import PaymentMethodStep from './checkout/PaymentMethodStep'
import PaymentDetailsStep from './checkout/PaymentDetailsStep'
import ConfirmationStep from './checkout/ConfirmationStep'
import SuccessStep from './checkout/SuccessStep'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, obtenerPrecioTotal, vaciarCarrito } = useCartStore()
  const { usuario, token } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  // Verificar que solo clientes puedan acceder al checkout
  if (usuario?.rol !== 'cliente') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Acceso Restringido" size="md">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-red-500 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600 mb-6">Solo los clientes pueden realizar compras</p>
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            Entendido
          </button>
        </div>
      </Modal>
    )
  }

  const total = obtenerPrecioTotal()

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    setError(null)
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const processPayment = async () => {
    if (!token) {
      setError('Debes iniciar sesión para continuar')
      return
    }
    
    if (usuario?.rol !== 'cliente') {
      setError('Solo los clientes pueden realizar compras')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const resultado = await api.procesarCheckout(token, {
        usuario: usuario,
        items: items,
        total: total,
        metodoPago: selectedMethod,
        direccion_envio: 'Dirección predeterminada'
      })

      if (resultado.exito) {
        setOrderId(resultado.orden.id)
        setCurrentStep(4)
        vaciarCarrito()
      } else {
        setError(resultado.error || 'Error al procesar el pago')
      }
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
    onClose()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PaymentMethodStep
            selectedMethod={selectedMethod}
            onMethodSelect={handleMethodSelect}
            onNext={nextStep}
          />
        )
      case 2:
        return (
          <PaymentDetailsStep
            selectedMethod={selectedMethod}
            total={total}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 3:
        return (
          <ConfirmationStep
            selectedMethod={selectedMethod}
            isLoading={isLoading}
            onConfirm={processPayment}
            onBack={prevStep}
          />
        )
      case 4:
        return (
          <SuccessStep
            orderId={orderId}
            onClose={handleClose}
          />
        )
      default:
        return null
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={currentStep === 4 ? handleClose : onClose} 
      title={currentStep === 4 ? '' : 'Checkout'} 
      size="lg"
    >
      <div className="space-y-6">
        {currentStep < 4 && (
          <>
            <CheckoutSteps currentStep={currentStep} totalSteps={4} />
            
            <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 flex items-center">
                  <i className="fas fa-shopping-bag mr-2 text-primary"></i>
                  {items.length} producto(s)
                </span>
                <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center animate-shake">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {renderStepContent()}
      </div>
    </Modal>
  )
}