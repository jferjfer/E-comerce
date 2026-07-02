import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice } from '@/utils/sanitize'
import { API_URL } from '@/config/api'

interface SuccessStepProps {
  orderId: string | null
  onClose: () => void
  metodoPago?: string
  cuotaMensual?: number
  plazo?: number
}

// ADDI_TEMP: formulario de datos de envío post-pago para flujo sin login
// Revertir cuando ADDI apruebe: eliminar FormularioEnvio y mostrar directamente los botones
function FormularioEnvio({ orderId, onGuardado }: { orderId: string; onGuardado: () => void }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    if (!nombre.trim() || !telefono.trim() || !direccion.trim() || !ciudad.trim()) {
      setError('Nombre, teléfono, dirección y ciudad son obligatorios')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${orderId}/datos-envio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, direccion, ciudad, departamento })
      })
      if (res.ok) {
        onGuardado()
      } else {
        const d = await res.json()
        setError(d.error || 'Error guardando datos')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4 text-left">
      <div>
        <h3 className="text-lg font-bold text-gray-900 text-center">¿A dónde enviamos tu pedido?</h3>
        <p className="text-sm text-gray-500 text-center mt-1">Ingresa tus datos para coordinar la entrega</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre completo *</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com (para confirmación)"
            className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Teléfono / WhatsApp *</label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="3XX XXX XXXX"
            className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dirección de entrega *</label>
          <input
            type="text"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
            placeholder="Calle, carrera, número, barrio"
            className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ciudad *</label>
            <input
              type="text"
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              placeholder="Bogotá"
              className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Departamento</label>
            <input
              type="text"
              value={departamento}
              onChange={e => setDepartamento(e.target.value)}
              placeholder="Cundinamarca"
              className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <i className="fas fa-exclamation-circle"></i> {error}
        </p>
      )}

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
      >
        {guardando
          ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>Guardando...</>
          : <><i className="fas fa-truck mr-2"></i>Confirmar datos de envío</>
        }
      </button>
    </div>
  )
}
// FIN ADDI_TEMP

export default function SuccessStep({ orderId, onClose, metodoPago, cuotaMensual, plazo }: SuccessStepProps) {
  const navigate = useNavigate()
  const esCredito = metodoPago === 'credito_interno'
  const esEfectivo = metodoPago === 'efectivo'

  // ADDI_TEMP: estado para controlar si ya se guardaron los datos de envío
  // Revertir cuando ADDI apruebe: eliminar este estado y el condicional de abajo
  const [envioGuardado, setEnvioGuardado] = useState(false)

  // ADDI_TEMP: mostrar formulario de envío antes de la pantalla de éxito final
  if (orderId && !envioGuardado) {
    return (
      <div className="py-4 space-y-4">
        {/* Icono de pago exitoso */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <i className="fas fa-check text-white text-2xl"></i>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">¡Pago recibido!</p>
            <p className="text-xs text-gray-500">Pedido <span className="font-mono font-bold">#{orderId}</span></p>
          </div>
        </div>

        <div className="border-t pt-4">
          <FormularioEnvio orderId={orderId} onGuardado={() => setEnvioGuardado(true)} />
        </div>
      </div>
    )
  }
  // FIN ADDI_TEMP

  return (
    <div className="text-center py-6 space-y-6">
      {/* Icono */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg ${
        esEfectivo ? 'bg-amber-500' : 'bg-emerald-500'
      }`}>
        <i className={`fas ${esEfectivo ? 'fa-clock' : 'fa-check'} text-white text-3xl`}></i>
      </div>

      {/* Título */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          {esEfectivo ? '¡Pedido creado!' : '¡Pedido recibido!'}
        </h3>
        <p className="text-gray-500 mt-1 text-sm">
          {esEfectivo
            ? 'Realiza el pago en Efecty o Baloto para confirmar tu pedido'
            : 'Tu pedido fue recibido. Recibirás un correo cuando el pago sea confirmado.'}
        </p>
      </div>

      {/* Número de orden */}
      {orderId && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 inline-block w-full">
          <p className="text-xs text-gray-500 mb-1">Número de orden</p>
          <p className="font-mono text-lg font-bold text-primary">#{orderId}</p>
        </div>
      )}

      {/* Info crédito */}
      {esCredito && cuotaMensual && plazo && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tu plan de cuotas</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cuota mensual</span>
            <span className="font-bold text-primary">{formatPrice(cuotaMensual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Plazo</span>
            <span className="font-semibold text-gray-800">{plazo} meses</span>
          </div>
        </div>
      )}

      {/* Info efectivo */}
      {esEfectivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <p className="text-xs font-semibold text-amber-800 mb-1">
            <i className="fas fa-exclamation-circle mr-1"></i>
            Tu pedido está pendiente
          </p>
          <p className="text-xs text-amber-700">
            Tienes 48 horas para realizar el pago. Recibirás el código por email.
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="space-y-2">
        <button
          onClick={() => { onClose(); navigate('/orders') }}
          className="w-full bg-primary text-white py-3 rounded-xl hover:bg-secondary transition-colors font-semibold text-sm"
        >
          <i className="fas fa-shopping-bag mr-2"></i>
          Ver mis pedidos
        </button>
        <button
          onClick={onClose}
          className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Seguir comprando
        </button>
      </div>
    </div>
  )
}
