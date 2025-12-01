import { useState } from 'react'
import { metodosPago } from '@/data/products'
import { formatPrice } from '@/utils/sanitize'

interface PaymentDetailsStepProps {
  selectedMethod: string
  total: number
  onNext: () => void
  onBack: () => void
}

export default function PaymentDetailsStep({ selectedMethod, total, onNext, onBack }: PaymentDetailsStepProps) {
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  })

  const method = metodosPago.find(m => m.id === selectedMethod)

  const handleCardChange = (field: string, value: string) => {
    if (field === 'number') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim()
    }
    if (field === 'expiry') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2')
    }
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4)
    }
    setCardData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Datos de pago</h3>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <i className={`${method?.icono} text-primary`}></i>
          <span>{method?.nombre}</span>
        </div>
      </div>

      {selectedMethod === 'contado' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-credit-card text-primary mr-2"></i>
              Información de la tarjeta
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  value={cardData.number}
                  onChange={(e) => handleCardChange('number', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => handleCardChange('name', e.target.value.toUpperCase())}
                  placeholder="JUAN PÉREZ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de vencimiento
                  </label>
                  <input
                    type="text"
                    value={cardData.expiry}
                    onChange={(e) => handleCardChange('expiry', e.target.value)}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => handleCardChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center text-green-800">
              <i className="fas fa-shield-alt mr-2"></i>
              <span className="text-sm font-medium">Pago 100% seguro y encriptado</span>
            </div>
          </div>
        </div>
      )}

      {selectedMethod === 'interno' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6">
            <h4 className="font-bold text-primary mb-3 flex items-center">
              <i className="fas fa-star mr-2"></i>
              Crédito StyleHub Pre-aprobado
            </h4>
            <p className="text-gray-700 mb-4">Selecciona el plan de cuotas que mejor se adapte a ti:</p>
            
            <div className="space-y-3">
              {[3, 6, 12].map(cuotas => (
                <label key={cuotas} className="flex items-center p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="cuotas" className="mr-3 w-4 h-4 text-primary focus:ring-primary" />
                  <div className="flex-1">
                    <span className="font-semibold">{cuotas} cuotas de {formatPrice(Math.ceil(total / cuotas))}</span>
                    {cuotas <= 6 && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Sin interés</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {(selectedMethod === 'addi' || selectedMethod === 'sistecredito') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="text-center">
            <i className="fas fa-external-link-alt text-blue-600 text-3xl mb-3"></i>
            <h4 className="font-bold text-blue-800 mb-2">Redirección Segura</h4>
            <p className="text-blue-700 mb-4">
              Serás redirigido a {method?.nombre} para completar tu solicitud de crédito
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="flex items-center">
                <i className="fas fa-clock mr-2"></i>
                Aprobación en minutos
              </div>
              <div className="flex items-center">
                <i className="fas fa-mobile-alt mr-2"></i>
                100% digital
              </div>
            </div>
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