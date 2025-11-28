import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { metodosPago } from '@/data/products'
import { formatPrice } from '@/utils/sanitize'
import { api } from '@/services/api'
import Modal from './Modal'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, obtenerPrecioTotal, vaciarCarrito } = useCartStore()
  const { usuario, token } = useAuthStore()
  const [selectedMethod, setSelectedMethod] = useState('')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const total = obtenerPrecioTotal()

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    setShowPaymentDetails(true)
    setError(null)
  }

  const processPayment = async () => {
    if (!token) {
      setError('Debes iniciar sesión para continuar')
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
        setShowPaymentDetails(false)
        setShowSuccess(true)
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
    setShowSuccess(false)
    setShowPaymentDetails(false)
    setSelectedMethod('')
    setOrderId(null)
    onClose()
  }

  if (showSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <div className="text-center p-8 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-circle text-green-500 text-4xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h3>
          <p className="text-gray-600 mb-2">Tu pedido ha sido procesado correctamente</p>
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6 inline-block border border-gray-200">
              <span className="text-sm text-gray-500 block">ID de Orden</span>
              <span className="font-mono font-bold text-gray-800">{orderId}</span>
            </div>
          )}
          <button
            onClick={handleClose}
            className="w-full bg-primary text-white px-8 py-3 rounded-lg hover:bg-secondary transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
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
          <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen del Pedido</h4>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 flex items-center">
                <i className="fas fa-shopping-bag mr-2 text-primary"></i>
                {items.length} producto(s)
              </span>
              <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
            </div>
            <div className="text-xs text-gray-400 text-right">Incluye impuestos y envío</div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-lg font-semibold text-gray-800 border-b pb-2">
              <i className={`${method?.icono} text-primary`}></i>
              <span>{method?.nombre}</span>
            </div>

            {selectedMethod === 'contado' && (
              <div className="space-y-3 animate-fade-in">
                <button className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-primary transition-all text-left flex items-center group">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                    <i className="fas fa-credit-card text-blue-600"></i>
                  </div>
                  <span className="font-medium text-gray-700">Tarjeta de Crédito/Débito</span>
                </button>
                <button className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-primary transition-all text-left flex items-center group">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                    <i className="fas fa-university text-purple-600"></i>
                  </div>
                  <span className="font-medium text-gray-700">PSE - Pago Seguro</span>
                </button>
              </div>
            )}

            {selectedMethod === 'interno' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
                  <i className="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                  <div>
                    <p className="text-green-800 font-semibold">¡Crédito Pre-aprobado!</p>
                    <p className="text-green-700 text-sm">Disfruta de tu compra ahora y paga después.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="cuotas" className="mr-3 w-4 h-4 text-primary focus:ring-primary" defaultChecked />
                    <span className="flex-1">3 cuotas de <span className="font-bold">{formatPrice(Math.ceil(total / 3))}</span></span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Sin interés</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="cuotas" className="mr-3 w-4 h-4 text-primary focus:ring-primary" />
                    <span className="flex-1">6 cuotas de <span className="font-bold">{formatPrice(Math.ceil(total / 6))}</span></span>
                  </label>
                </div>
              </div>
            )}

            {(selectedMethod === 'addi' || selectedMethod === 'sistecredito') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 animate-fade-in">
                <div className="flex items-center mb-3">
                  <i className="fas fa-external-link-alt text-blue-600 mr-2"></i>
                  <p className="text-blue-800 font-semibold">Redirección Segura</p>
                </div>
                <p className="text-sm text-blue-700 mb-3">Serás redirigido a la plataforma segura de {method?.nombre} para completar tu solicitud de crédito en minutos.</p>
                <ul className="text-sm space-y-2 text-blue-800">
                  <li className="flex items-center"><i className="fas fa-check text-blue-500 mr-2"></i>Aprobación en tiempo real</li>
                  <li className="flex items-center"><i className="fas fa-check text-blue-500 mr-2"></i>Sin papeleos físicos</li>
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center animate-shake">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={processPayment}
              disabled={isLoading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-secondary hover:shadow-xl'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Procesando...
                </span>
              ) : (
                'Confirmar Pago'
              )}
            </button>
            <button
              onClick={() => setShowPaymentDetails(false)}
              disabled={isLoading}
              className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Volver a métodos de pago
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Opciones de Pago" size="lg">
      <div className="space-y-8">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h4 className="font-semibold text-gray-600 mb-3 text-sm uppercase tracking-wide">Resumen del Pedido</h4>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{items.length} producto(s) en tu carrito</span>
            <span className="text-3xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-bold text-gray-800 px-1">Selecciona tu método de pago</h4>

          <div className="grid gap-4">
            {metodosPago.map((method) => (
              <div
                key={method.id}
                onClick={() => handleMethodSelect(method.id)}
                className="group border border-gray-200 rounded-xl p-5 hover:border-primary hover:shadow-md cursor-pointer transition-all duration-200 bg-white"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <i className={`${method.icono} text-gray-600 group-hover:text-primary text-xl transition-colors`}></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{method.nombre}</h5>
                    <p className="text-sm text-gray-500 mt-1">{method.descripcion}</p>
                  </div>
                  <i className="fas fa-chevron-right text-gray-300 group-hover:text-primary transition-colors"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}