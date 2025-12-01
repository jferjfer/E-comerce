import { metodosPago } from '@/data/products'

interface PaymentMethodStepProps {
  selectedMethod: string
  onMethodSelect: (methodId: string) => void
  onNext: () => void
}

export default function PaymentMethodStep({ selectedMethod, onMethodSelect, onNext }: PaymentMethodStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Selecciona tu método de pago</h3>
        <p className="text-gray-600">Elige la opción que más te convenga</p>
      </div>

      <div className="grid gap-4">
        {metodosPago.map((method) => (
          <div
            key={method.id}
            onClick={() => onMethodSelect(method.id)}
            className={`group border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-gray-200 hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                selectedMethod === method.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary'
              }`}>
                <i className={`${method.icono} text-2xl`}></i>
              </div>
              <div className="flex-1">
                <h4 className={`text-xl font-bold transition-colors ${
                  selectedMethod === method.id ? 'text-primary' : 'text-gray-800'
                }`}>
                  {method.nombre}
                </h4>
                <p className="text-gray-600 mt-1">{method.descripcion}</p>
                {method.monto_maximo && (
                  <p className="text-sm text-green-600 mt-2">
                    <i className="fas fa-check-circle mr-1"></i>
                    Hasta ${method.monto_maximo.toLocaleString()}
                  </p>
                )}
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === method.id
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <i className="fas fa-check text-white text-xs"></i>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!selectedMethod}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          selectedMethod
            ? 'bg-primary text-white hover:bg-secondary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continuar
        <i className="fas fa-arrow-right ml-2"></i>
      </button>
    </div>
  )
}