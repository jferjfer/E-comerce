import { metodosPago } from '@/data/metodosPago'
import { useEffect } from 'react'

interface PaymentMethodStepProps {
  selectedMethod: string
  onMethodSelect: (methodId: string) => void
  onNext: () => void
  evaluacionCredito?: any
  cargandoCredito?: boolean
}

export default function PaymentMethodStep({
  selectedMethod,
  onMethodSelect,
  onNext,
}: PaymentMethodStepProps) {

  // Auto-seleccionar si solo hay un método
  useEffect(() => {
    if (metodosPago.length === 1 && !selectedMethod) {
      onMethodSelect(metodosPago[0].id)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">¿Cómo quieres pagar?</h3>
        <p className="text-sm text-gray-500 mt-0.5">Selecciona un método de pago</p>
      </div>

      <div className="space-y-3">
        {metodosPago.map((method) => {
          const seleccionado = selectedMethod === method.id
          return (
            <div
              key={method.id}
              onClick={() => onMethodSelect(method.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                seleccionado
                  ? 'border-primary bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                seleccionado ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <i className={`${method.icono} text-sm`}></i>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{method.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{method.descripcion}</p>
              </div>

              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                seleccionado ? 'border-primary bg-primary' : 'border-gray-300'
              }`}>
                {seleccionado && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!selectedMethod}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
          selectedMethod
            ? 'bg-primary text-white hover:bg-secondary'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continuar
        <i className="fas fa-arrow-right ml-2"></i>
      </button>
    </div>
  )
}
