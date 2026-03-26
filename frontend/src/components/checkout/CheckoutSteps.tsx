interface CheckoutStepsProps {
  currentStep: number
  totalSteps: number
}

const steps = [
  { number: 1, title: 'Método', icon: 'fas fa-credit-card' },
  { number: 2, title: 'Datos',  icon: 'fas fa-edit' },
  { number: 3, title: 'Confirmar', icon: 'fas fa-check-double' },
  { number: 4, title: 'Éxito',  icon: 'fas fa-star' }
]

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="flex items-center justify-between relative">
      {/* Línea de fondo */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
      {/* Línea de progreso */}
      <div
        className="absolute top-4 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step) => {
        const done    = step.number < currentStep
        const active  = step.number === currentStep
        const pending = step.number > currentStep

        return (
          <div key={step.number} className="flex flex-col items-center z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              done    ? 'bg-primary text-white shadow-md shadow-purple-200' :
              active  ? 'bg-primary text-white ring-4 ring-purple-200 shadow-md shadow-purple-200 scale-110' :
                        'bg-white border-2 border-gray-200 text-gray-400'
            }`}>
              {done
                ? <i className="fas fa-check text-xs" />
                : <i className={`${step.icon} text-xs`} />
              }
            </div>
            <span className={`text-[10px] font-semibold mt-1.5 hidden sm:block transition-colors ${
              active ? 'text-primary' : done ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {step.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}
