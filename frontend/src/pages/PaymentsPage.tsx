import { Link } from 'react-router-dom'

export default function PaymentsPage() {
  const metodosPago = [
    {
      id: 'tarjeta',
      nombre: 'Tarjeta de Crédito/Débito',
      icono: 'fa-credit-card',
      descripcion: 'Visa, Mastercard, American Express',
      activo: true
    },
    {
      id: 'pse',
      nombre: 'PSE',
      icono: 'fa-university',
      descripcion: 'Pago Seguro en Línea',
      activo: true
    },
    {
      id: 'interno',
      nombre: 'Crédito Interno',
      icono: 'fa-wallet',
      descripcion: 'Financiación propia de la tienda',
      activo: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-primary hover:text-secondary">
            <i className="fas fa-arrow-left mr-2"></i>
            Volver
          </Link>
          <h1 className="text-3xl font-bold text-primary">
            <i className="fas fa-credit-card mr-3"></i>
            Métodos de Pago
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Métodos Disponibles</h2>
          <div className="space-y-4">
            {metodosPago.map((metodo) => (
              <div key={metodo.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className={`fas ${metodo.icono} text-primary text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{metodo.nombre}</h3>
                    <p className="text-sm text-gray-600">{metodo.descripcion}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${metodo.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {metodo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <i className="fas fa-info-circle text-blue-600 mt-1"></i>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Información Importante</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Todas las transacciones son seguras y encriptadas</li>
                <li>• No almacenamos información de tarjetas de crédito</li>
                <li>• Puedes cambiar tu método de pago en cualquier momento</li>
                <li>• Los pagos se procesan al momento del checkout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
