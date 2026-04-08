import { metodosPago } from '@/data/metodosPago'
import { formatPrice } from '@/utils/sanitize'

interface PaymentDetailsStepProps {
  selectedMethod: string
  total: number
  onNext: () => void
  onBack: () => void
}

export default function PaymentDetailsStep({ selectedMethod, total, onNext, onBack }: PaymentDetailsStepProps) {
  const method = metodosPago.find(m => m.id === selectedMethod)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Datos de pago</h3>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <i className={`${method?.icono} text-primary`}></i>
          <span>{method?.nombre}</span>
        </div>
      </div>

      {selectedMethod === 'pago_en_linea' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="text-center">
            <i className="fas fa-shield-alt text-blue-600 text-3xl mb-3"></i>
            <h4 className="font-bold text-blue-800 mb-2">Pago Seguro con ePayco</h4>
            <p className="text-blue-700">
              Serás redirigido al widget de ePayco para completar tu pago con tarjeta, PSE, Nequi, Daviplata o Efecty.
            </p>
          </div>
        </div>
      )}

      {selectedMethod === 'credito_interno' && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center">
              <i className="fas fa-star mr-2 text-gold"></i>
              Crédito EGOS Pre-aprobado
            </h4>
            <p className="text-gray-700 mb-4">Selecciona el plan de cuotas que mejor se adapte a ti:</p>
            <div className="space-y-3">
              {[3, 6, 12].map(cuotas => (
                <label key={cuotas} className="flex items-center p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="cuotas" className="mr-3 w-4 h-4 text-primary focus:ring-gray-400" />
                  <div className="flex-1">
                    <span className="font-semibold">{cuotas} cuotas de {formatPrice(Math.ceil(total / cuotas))}</span>
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      Tasa {cuotas === 3 ? '2.5' : cuotas === 6 ? '2.2' : '1.9'}%/mes
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {(selectedMethod === 'efectivo') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="text-center">
            <i className="fas fa-money-bill-wave text-amber-600 text-3xl mb-3"></i>
            <h4 className="font-bold text-amber-800 mb-2">Pago en Efectivo</h4>
            <p className="text-amber-700">
              Se generará un código de pago. Tu pedido quedará pendiente hasta confirmar el pago en Efecty o Baloto.
            </p>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-bold"
        >
          Continuar
          <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  )
}