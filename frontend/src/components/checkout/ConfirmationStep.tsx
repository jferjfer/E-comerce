import { useCartStore } from '@/store/useCartStore'
import { metodosPago } from '@/data/products'
import { formatPrice } from '@/utils/sanitize'

interface ConfirmationStepProps {
  selectedMethod: string
  isLoading: boolean
  onConfirm: () => void
  onBack: () => void
}

export default function ConfirmationStep({ selectedMethod, isLoading, onConfirm, onBack }: ConfirmationStepProps) {
  const { items, obtenerPrecioTotal } = useCartStore()
  const method = metodosPago.find(m => m.id === selectedMethod)
  const total = obtenerPrecioTotal()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirma tu pedido</h3>
        <p className="text-gray-600">Revisa los detalles antes de finalizar</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-shopping-bag text-primary mr-2"></i>
          Resumen del pedido
        </h4>
        
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={`${item.id}-${item.talla}-${item.color}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <img src={item.imagen} alt={item.nombre} className="w-12 h-12 object-cover rounded-lg" />
                <div>
                  <p className="font-medium text-gray-800">{item.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {item.talla} • {item.color} • Cant: {item.cantidad}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-gray-800">
                {formatPrice(item.precio * item.cantidad)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center text-xl font-bold text-gray-800">
            <span>Total:</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <i className={`${method?.icono} text-primary mr-2`}></i>
          Método de pago
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">{method?.nombre}</p>
            <p className="text-sm text-gray-600">{method?.descripcion}</p>
          </div>
          <div className="text-right">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-check text-green-600 text-sm"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Información importante:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Recibirás un email de confirmación</li>
              <li>• El envío se procesará en 1-2 días hábiles</li>
              <li>• Puedes rastrear tu pedido desde tu cuenta</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-4 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-circle-notch fa-spin mr-2"></i>
              Procesando...
            </span>
          ) : (
            <>
              <i className="fas fa-lock mr-2"></i>
              Confirmar Pago
            </>
          )}
        </button>
      </div>
    </div>
  )
}