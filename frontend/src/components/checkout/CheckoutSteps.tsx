interface CheckoutStepsProps {
  currentStep: number
  totalSteps: number
}

const steps = [
  { number: 1, title: 'Método', icon: 'fas fa-credit-card' },
  { number: 2, title: 'Confirmar', icon: 'fas fa-check-double' },
]

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="flex items-center justify-between relative px-4">
      <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 z-0" />
      <div
        className="absolute top-4 left-8 h-0.5 bg-primary z-0 transition-all duration-500"
        style={{ width: currentStep >= 2 ? 'calc(100% - 4rem)' : '0%' }}
      />
      {steps.map((step) => {
        const done   = step.number < currentStep
        const active = step.number === currentStep
        return (
          <div key={step.number} className="flex flex-col items-center z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              done   ? 'bg-primary text-white' :
              active ? 'bg-primary text-white ring-4 ring-gray-200 scale-110' :
                       'bg-white border-2 border-gray-200 text-gray-400'
            }`}>
              {done
                ? <i className="fas fa-check text-xs" />
                : <i className={`${step.icon} text-xs`} />
              }
            </div>
            <span className={`text-[10px] font-semibold mt-1.5 transition-colors ${
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
