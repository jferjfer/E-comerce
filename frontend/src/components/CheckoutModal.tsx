import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { metodosPago } from '@/data/products'
import { formatPrice } from '@/utils/sanitize'
import Modal from './Modal'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, obtenerPrecioTotal, vaciarCarrito } = useCartStore()
  const [selectedMethod, setSelectedMethod] = useState('')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const total = obtenerPrecioTotal()

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    setShowPaymentDetails(true)
  }

  const processPayment = () => {
    setShowPaymentDetails(false)
    setShowSuccess(true)
    vaciarCarrito()
    
    setTimeout(() => {
      setShowSuccess(false)
      onClose()
    }, 3000)
  }

  if (showSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-white text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h3>
          <p className="text-gray-600 mb-6">Tu pedido ha sido procesado correctamente</p>
          <button 
            onClick={onClose}
            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-secondary transition-colors"
          >
            Continuar Comprando
          </button>
        </div>
      </Modal>
    )
  }

  if (showPaymentDetails) {
    const method = metodosPago.find(m => m.id === selectedMethod)
    
    return (
      <Modal isOpen={isOpen} onClose={() => setShowPaymentDetails(false)} title="Finalizar Compra" size="md">
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Resumen del Pedido</h4>
            <div className="flex justify-between items-center">
              <span>{items.length} producto(s)</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">{method?.nombre}</h4>
            
            {selectedMethod === 'contado' && (
              <div className="space-y-3">
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left">
                  <i className="fas fa-credit-card mr-2"></i> Tarjeta de Crédito/Débito
                </button>
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left">
                  <i className="fas fa-university mr-2"></i> PSE - Pago Seguro en Línea
                </button>
                <button className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left">
                  <i className="fas fa-mobile-alt mr-2 text-purple-600"></i> Nequi
                </button>
              </div>
            )}

            {selectedMethod === 'interno' && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800"><i className="fas fa-check mr-2"></i>¡Aprobación inmediata!</p>
                </div>
                <label className="block p-3 border rounded-lg hover:bg-gray-50">
                  <input type="radio" name="cuotas" className="mr-2" />
                  3 cuotas de {formatPrice(Math.ceil(total/3))} - Sin intereses
                </label>
                <label className="block p-3 border rounded-lg hover:bg-gray-50">
                  <input type="radio" name="cuotas" className="mr-2" />
                  6 cuotas de {formatPrice(Math.ceil(total/6))} - 2% interés mensual
                </label>
              </div>
            )}

            {(selectedMethod === 'addi' || selectedMethod === 'sistecredito') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 mb-3">Serás redirigido para completar la solicitud</p>
                <ul className="text-sm space-y-1">
                  <li>• Aprobación rápida</li>
                  <li>• Tasas competitivas</li>
                  <li>• Múltiples plazos disponibles</li>
                </ul>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
            <button 
              onClick={processPayment}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Confirmar Pago
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Opciones de Pago" size="lg">
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Resumen del Pedido</h4>
          <div className="flex justify-between items-center">
            <span>{items.length} producto(s)</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Selecciona tu método de pago:</h4>
          
          {metodosPago.map((method) => (
            <div 
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <i className={`${method.icono} text-primary text-xl`}></i>
                <div>
                  <h5 className="font-semibold">{method.nombre}</h5>
                  <p className="text-sm text-gray-600">{method.descripcion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}