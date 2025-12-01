interface CheckoutStepsProps {
  currentStep: number
  totalSteps: number
}

export default function CheckoutSteps({ currentStep, totalSteps }: CheckoutStepsProps) {
  const steps = [
    { number: 1, title: 'Método', icon: 'fas fa-credit-card' },
    { number: 2, title: 'Datos', icon: 'fas fa-edit' },
    { number: 3, title: 'Confirmar', icon: 'fas fa-check' },
    { number: 4, title: 'Éxito', icon: 'fas fa-star' }
  ]

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
            step.number <= currentStep 
              ? 'bg-primary border-primary text-white' 
              : 'border-gray-300 text-gray-400'
          }`}>
            <i className={`${step.icon} text-sm`}></i>
          </div>
          <div className="ml-3 hidden sm:block">
            <p className={`text-sm font-medium ${
              step.number <= currentStep ? 'text-primary' : 'text-gray-400'
            }`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-4 ${
              step.number < currentStep ? 'bg-primary' : 'bg-gray-300'
            }`}></div>
          )}
        </div>
      ))}
    </div>
  )
}