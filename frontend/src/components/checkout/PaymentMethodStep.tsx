import { metodosPago } from '@/data/products'
import { formatPrice } from '@/utils/sanitize'

interface EvaluacionCredito {
  califica: boolean
  limite_aprobado?: number
  meses_antiguedad?: number
}

interface PaymentMethodStepProps {
  selectedMethod: string
  onMethodSelect: (methodId: string) => void
  onNext: () => void
  evaluacionCredito: EvaluacionCredito | null
  cargandoCredito: boolean
}

export default function PaymentMethodStep({
  selectedMethod,
  onMethodSelect,
  onNext,
  evaluacionCredito,
  cargandoCredito
}: PaymentMethodStepProps) {

  // Filtrar métodos: crédito solo si califica
  const metodosVisibles = metodosPago.filter(m => {
    if (m.id === 'credito_interno') return evaluacionCredito?.califica === true
    return true
  })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">¿Cómo quieres pagar?</h3>
        <p className="text-sm text-gray-500 mt-0.5">Selecciona un método de pago</p>
      </div>

      {/* Métodos de pago */}
      <div className="space-y-3">
        {metodosVisibles.map((method) => {
          const seleccionado = selectedMethod === method.id
          const esCredito = method.id === 'credito_interno'

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
              {/* Icono */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                seleccionado ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <i className={`${method.icono} text-sm`}></i>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{method.nombre}</p>
                  {esCredito && evaluacionCredito?.limite_aprobado && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      Hasta {formatPrice(evaluacionCredito.limite_aprobado)}
                    </span>
                  )}
                  {(method.id === 'efectivo') && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{method.descripcion}</p>
              </div>

              {/* Radio */}
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                seleccionado ? 'border-primary bg-primary' : 'border-gray-300'
              }`}>
                {seleccionado && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          )
        })}

        {/* Skeleton mientras carga evaluación de crédito */}
        {cargandoCredito && (
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 bg-gray-50 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        )}
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
