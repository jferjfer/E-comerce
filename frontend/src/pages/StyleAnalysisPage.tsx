import { useState } from 'react'
import { api } from '@/services/api'
import { useNavigate } from 'react-router-dom'

const PREGUNTAS = [
  {
    id: 1,
    titulo: '¿Para qué ocasiones compras ropa?',
    opciones: [
      { label: 'Trabajo', emoji: '💼' },
      { label: 'Casual', emoji: '👕' },
      { label: 'Fiesta', emoji: '🎉' },
      { label: 'Deporte', emoji: '⚡' },
      { label: 'Formal', emoji: '🎩' },
    ],
  },
  {
    id: 2,
    titulo: '¿Qué colores prefieres?',
    subtitulo: 'Elige todos los que quieras',
    multi: true,
    opciones: [
      { label: 'Negro', emoji: '🖤' },
      { label: 'Blanco', emoji: '🤍' },
      { label: 'Azul', emoji: '💙' },
      { label: 'Rojo', emoji: '❤️' },
      { label: 'Verde', emoji: '💚' },
      { label: 'Rosa', emoji: '🌸' },
      { label: 'Gris', emoji: '🩶' },
    ],
  },
  {
    id: 3,
    titulo: '¿Cómo describes tu estilo?',
    opciones: [
      { label: 'Clásico', emoji: '✨' },
      { label: 'Moderno', emoji: '🔮' },
      { label: 'Casual', emoji: '😎' },
      { label: 'Elegante', emoji: '👑' },
      { label: 'Deportivo', emoji: '🏃' },
      { label: 'Bohemio', emoji: '🌿' },
    ],
  },
]

export default function StyleAnalysisPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [respuestas, setRespuestas] = useState<Record<number, any>>({})

  const pregunta = PREGUNTAS[step]
  const progreso = Math.round(((step + 1) / PREGUNTAS.length) * 100)

  const seleccionar = (label: string) => {
    if (pregunta.multi) {
      const actual: string[] = respuestas[pregunta.id] || []
      const nuevo = actual.includes(label)
        ? actual.filter(x => x !== label)
        : [...actual, label]
      setRespuestas(p => ({ ...p, [pregunta.id]: nuevo }))
    } else {
      setRespuestas(p => ({ ...p, [pregunta.id]: label }))
    }
  }

  const estaActivo = (label: string) => {
    const val = respuestas[pregunta.id]
    if (pregunta.multi) return Array.isArray(val) && val.includes(label)
    return val === label
  }

  const puedeAvanzar = () => {
    const val = respuestas[pregunta.id]
    if (!val) return false
    if (pregunta.multi) return (val as string[]).length > 0
    return true
  }

  const siguiente = async () => {
    if (step < PREGUNTAS.length - 1) {
      setStep(s => s + 1)
    } else {
      setLoading(true)
      const ocasion = respuestas[1] || ''
      const colores = (respuestas[2] || []).join(', ')
      const estilo = respuestas[3] || ''
      const descripcion = `Ocasión: ${ocasion}, Colores: ${colores}, Estilo: ${estilo}`
      const r = await api.analizarEstilo(descripcion).catch(() => ({ estilos: [] }))
      setResultado({ ocasion, colores, estilo, data: r })
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-2 border-gold rounded-full animate-spin border-t-transparent mx-auto"></div>
          <p className="text-white font-medium">Analizando tu estilo...</p>
          <p className="text-gray-400 text-sm">La IA está personalizando tu experiencia</p>
        </div>
      </div>
    )
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header resultado */}
          <div className="bg-gray-900 rounded-2xl p-8 text-center mb-6">
            <p className="text-xs tracking-[4px] uppercase mb-3" style={{ color: '#c5a47e' }}>
              Tu perfil de estilo
            </p>
            <h2 className="text-4xl font-bold text-white mb-1">{resultado.estilo}</h2>
            <p className="text-gray-400 text-sm">Basado en tus preferencias</p>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 space-y-3">
            {[
              { label: 'Ocasión', valor: resultado.ocasion },
              { label: 'Colores favoritos', valor: resultado.colores },
              { label: 'Estilo dominante', valor: resultado.estilo },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.valor}</span>
              </div>
            ))}
          </div>

          {/* Mensaje Noa */}
          <div className="bg-gray-900 rounded-2xl p-5 mb-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center border border-yellow-600">
                <span className="text-yellow-500 text-xs font-bold">N</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: '#c5a47e' }}>Noa te recomienda</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Basado en tus preferencias, te recomendamos prendas de estilo{' '}
              <span style={{ color: '#c5a47e' }} className="font-semibold">{resultado.estilo.toLowerCase()}</span>
              {' '}en tonos{' '}
              <span style={{ color: '#c5a47e' }} className="font-semibold">{resultado.colores.toLowerCase()}</span>.
              Perfectas para ocasiones de{' '}
              <span style={{ color: '#c5a47e' }} className="font-semibold">{resultado.ocasion.toLowerCase()}</span>.
            </p>
          </div>

          <button
            onClick={() => navigate('/catalog')}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold hover:bg-gray-700 transition-colors mb-3"
            style={{ color: '#c5a47e' }}
          >
            Ver productos recomendados →
          </button>
          <button
            onClick={() => { setResultado(null); setStep(0); setRespuestas({}) }}
            className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm hover:bg-gray-50 transition-colors"
          >
            Volver a analizar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-[4px] uppercase text-gray-400 mb-2">EGOS</p>
          <h1 className="text-3xl font-bold text-gray-900">Descubre Tu Estilo</h1>
          <p className="text-gray-500 text-sm mt-1">Responde {PREGUNTAS.length} preguntas simples</p>
        </div>

        {/* Progreso */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Pregunta {step + 1} de {PREGUNTAS.length}</span>
            <span>{progreso}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{pregunta.titulo}</h2>
          {pregunta.subtitulo && (
            <p className="text-sm text-gray-400 mb-4">{pregunta.subtitulo}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {pregunta.opciones.map(op => (
              <button
                key={op.label}
                onClick={() => seleccionar(op.label)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  estaActivo(op.label)
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                <span>{op.emoji}</span>
                <span>{op.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={siguiente}
          disabled={!puedeAvanzar()}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: puedeAvanzar() ? '#c5a47e' : undefined }}
        >
          {step < PREGUNTAS.length - 1 ? 'Siguiente →' : '✨ Ver mi estilo'}
        </button>

      </div>
    </div>
  )
}
