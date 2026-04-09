import { useNavigate } from 'react-router-dom'
import { formatPrice } from '@/utils/sanitize'

interface SuccessStepProps {
  orderId: string | null
  onClose: () => void
  metodoPago?: string
  cuotaMensual?: number
  plazo?: number
}

export default function SuccessStep({ orderId, onClose, metodoPago, cuotaMensual, plazo }: SuccessStepProps) {
  const navigate = useNavigate()
  const esCredito = metodoPago === 'credito_interno'
  const esEfectivo = metodoPago === 'efectivo'

  return (
    <div className="text-center py-6 space-y-6">
      {/* Icono */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg ${
        esEfectivo ? 'bg-amber-500' : 'bg-emerald-500'
      }`}>
        <i className={`fas ${esEfectivo ? 'fa-clock' : 'fa-check'} text-white text-3xl`}></i>
      </div>

      {/* Título */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          {esEfectivo ? '¡Pedido creado!' : '¡Pago exitoso!'}
        </h3>
        <p className="text-gray-500 mt-1 text-sm">
          {esEfectivo
            ? 'Realiza el pago en Efecty o Baloto para confirmar tu pedido'
            : 'Tu pedido ha sido confirmado y está siendo preparado'}
        </p>
      </div>

      {/* Número de orden */}
      {orderId && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 inline-block w-full">
          <p className="text-xs text-gray-500 mb-1">Número de orden</p>
          <p className="font-mono text-lg font-bold text-primary">#{orderId}</p>
        </div>
      )}

      {/* Info crédito */}
      {esCredito && cuotaMensual && plazo && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tu plan de cuotas</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cuota mensual</span>
            <span className="font-bold text-primary">{formatPrice(cuotaMensual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Plazo</span>
            <span className="font-semibold text-gray-800">{plazo} meses</span>
          </div>
        </div>
      )}

      {/* Info efectivo */}
      {esEfectivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <p className="text-xs font-semibold text-amber-800 mb-1">
            <i className="fas fa-exclamation-circle mr-1"></i>
            Tu pedido está pendiente
          </p>
          <p className="text-xs text-amber-700">
            Tienes 48 horas para realizar el pago. Recibirás el código por email.
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="space-y-2">
        <button
          onClick={() => { onClose(); navigate('/orders') }}
          className="w-full bg-primary text-white py-3 rounded-xl hover:bg-secondary transition-colors font-semibold text-sm"
        >
          <i className="fas fa-shopping-bag mr-2"></i>
          Ver mis pedidos
        </button>
        <button
          onClick={onClose}
          className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Seguir comprando
        </button>
      </div>
    </div>
  )
}
