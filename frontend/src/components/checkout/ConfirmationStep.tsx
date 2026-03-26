import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { metodosPago } from '@/data/products'
import { formatPrice } from '@/utils/sanitize'

interface ConfirmationStepProps {
  selectedMethod: string
  isLoading: boolean
  onConfirm: (plazo?: number) => void
  onBack: () => void
  limiteCredito?: number
}

export default function ConfirmationStep({
  selectedMethod,
  isLoading,
  onConfirm,
  onBack,
  limiteCredito
}: ConfirmationStepProps) {
  const { items, obtenerPrecioTotal } = useCartStore()
  const method = metodosPago.find(m => m.id === selectedMethod)
  const total = obtenerPrecioTotal()
  const [plazoSeleccionado, setPlazoSeleccionado] = useState(6)

  const esCredito = selectedMethod === 'credito_interno'
  const esEfectivo = selectedMethod === 'efectivo'

  const calcularCuota = (plazo: number) => Math.ceil(total / plazo)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Confirma tu pedido</h3>
        <p className="text-sm text-gray-500 mt-0.5">Revisa antes de finalizar</p>
      </div>

      {/* Productos */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {items.length} producto(s)
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <img src={item.imagen} alt={item.nombre} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
                <p className="text-xs text-gray-500">Cant: {item.cantidad}</p>
              </div>
              <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                {formatPrice(item.precio * item.cantidad)}
              </span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <span className="font-semibold text-gray-700 text-sm">Total</span>
          <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Método seleccionado */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <i className={`${method?.icono} text-white text-xs`}></i>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{method?.nombre}</p>
          <p className="text-xs text-gray-500">{method?.descripcion}</p>
        </div>
      </div>

      {/* Selector de cuotas para crédito interno */}
      {esCredito && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Elige tu plan de cuotas:</p>
          <div className="grid grid-cols-3 gap-2">
            {[3, 6, 12].map(plazo => (
              <button
                key={plazo}
                onClick={() => setPlazoSeleccionado(plazo)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  plazoSeleccionado === plazo
                    ? 'border-primary bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-bold text-gray-900">{plazo} cuotas</p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  {formatPrice(calcularCuota(plazo))}/mes
                </p>
                {plazo <= 6 && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Sin interés</p>
                )}
              </button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total a pagar</span>
              <span className="font-bold text-gray-900">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Cuota mensual</span>
              <span className="font-bold text-primary">{formatPrice(calcularCuota(plazoSeleccionado))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Aviso efectivo */}
      {esEfectivo && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <i className="fas fa-info-circle text-amber-500 mt-0.5 flex-shrink-0"></i>
          <p className="text-xs text-amber-800">
            Se generará un código de pago. Tu pedido quedará <strong>pendiente</strong> hasta confirmar el pago en Efecty o Baloto.
          </p>
        </div>
      )}

      {/* Aviso pago en línea */}
      {selectedMethod === 'pago_en_linea' && (
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <i className="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0"></i>
          <p className="text-xs text-blue-800">
            Serás redirigido a la pasarela de pagos para completar tu transacción de forma segura.
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver
        </button>
        <button
          onClick={() => onConfirm(esCredito ? plazoSeleccionado : undefined)}
          disabled={isLoading}
          className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-secondary transition-colors font-bold text-sm disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-circle-notch fa-spin text-xs"></i>
              Procesando...
            </span>
          ) : (
            <>
              <i className="fas fa-lock mr-2 text-xs"></i>
              {esCredito ? 'Confirmar y financiar' : esEfectivo ? 'Generar código' : 'Confirmar pedido'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
