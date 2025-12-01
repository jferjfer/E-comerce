interface SuccessStepProps {
  orderId: string | null
  onClose: () => void
}

export default function SuccessStep({ orderId, onClose }: SuccessStepProps) {
  return (
    <div className="text-center py-8 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
          <i className="fas fa-check text-white text-4xl"></i>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
          <i className="fas fa-star text-white text-sm"></i>
        </div>
      </div>

      <h3 className="text-3xl font-bold text-gray-800 mb-3">¡Pago Exitoso!</h3>
      <p className="text-lg text-gray-600 mb-6">Tu pedido ha sido procesado correctamente</p>

      {orderId && (
        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 mb-8 inline-block shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <i className="fas fa-receipt text-primary"></i>
            <span className="text-sm font-medium text-gray-600">Número de orden</span>
          </div>
          <div className="font-mono text-2xl font-bold text-primary bg-white px-4 py-2 rounded-lg border">
            {orderId}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <i className="fas fa-envelope text-blue-600 text-xl mb-2"></i>
          <p className="font-medium text-blue-800">Email enviado</p>
          <p className="text-blue-600">Confirmación en tu correo</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <i className="fas fa-truck text-purple-600 text-xl mb-2"></i>
          <p className="font-medium text-purple-800">Preparando envío</p>
          <p className="text-purple-600">1-2 días hábiles</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <i className="fas fa-map-marker-alt text-green-600 text-xl mb-2"></i>
          <p className="font-medium text-green-800">Seguimiento</p>
          <p className="text-green-600">Disponible pronto</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onClose}
          className="w-full bg-primary text-white px-8 py-4 rounded-xl hover:bg-secondary transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
        >
          <i className="fas fa-shopping-bag mr-2"></i>
          Continuar Comprando
        </button>
        
        <button className="w-full border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium">
          <i className="fas fa-user mr-2"></i>
          Ver mis pedidos
        </button>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-center space-x-2 text-yellow-800">
          <i className="fas fa-gift"></i>
          <span className="font-medium">¡Gracias por tu compra!</span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Comparte tu experiencia y obtén descuentos en tu próxima compra
        </p>
      </div>
    </div>
  )
}