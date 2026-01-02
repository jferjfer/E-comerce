import { useState } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'

export default function StyleAnalysisPage() {
  const { usuario } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [respuestas, setRespuestas] = useState({
    ocasion: '',
    colores: [] as string[],
    estilo: '',
    presupuesto: ''
  })

  const preguntas = {
    1: {
      titulo: '¿Para qué ocasiones compras ropa?',
      opciones: ['Trabajo', 'Casual', 'Fiesta', 'Deporte', 'Formal']
    },
    2: {
      titulo: '¿Qué colores prefieres?',
      opciones: ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Rosa', 'Gris']
    },
    3: {
      titulo: '¿Cómo describes tu estilo?',
      opciones: ['Clásico', 'Moderno', 'Casual', 'Elegante', 'Deportivo', 'Bohemio']
    }
  }

  const handleAnalizar = async () => {
    setLoading(true)
    const descripcion = `Ocasión: ${respuestas.ocasion}, Colores: ${respuestas.colores.join(', ')}, Estilo: ${respuestas.estilo}`
    const result = await api.analizarEstilo(descripcion)
    setResultado(result)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Descubre Tu Estilo
          </h1>
          <p className="text-center text-gray-600 mb-8">Responde 3 preguntas simples</p>

          {!resultado ? (
            <>
              {step === 1 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">{preguntas[1].titulo}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {preguntas[1].opciones.map(op => (
                      <button
                        key={op}
                        onClick={() => {
                          setRespuestas({...respuestas, ocasion: op})
                          setStep(2)
                        }}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">{preguntas[2].titulo}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {preguntas[2].opciones.map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          const nuevos = respuestas.colores.includes(color)
                            ? respuestas.colores.filter(c => c !== color)
                            : [...respuestas.colores, color]
                          setRespuestas({...respuestas, colores: nuevos})
                        }}
                        className={`p-3 border-2 rounded-xl transition-all ${
                          respuestas.colores.includes(color)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    disabled={respuestas.colores.length === 0}
                    className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">{preguntas[3].titulo}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {preguntas[3].opciones.map(op => (
                      <button
                        key={op}
                        onClick={() => {
                          setRespuestas({...respuestas, estilo: op})
                        }}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          respuestas.estilo === op
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleAnalizar}
                    disabled={!respuestas.estilo || loading}
                    className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl disabled:opacity-50"
                  >
                    {loading ? 'Analizando...' : 'Ver Mi Estilo'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <i className="fas fa-star text-white text-4xl"></i>
              </div>
              <h2 className="text-2xl font-bold mb-4">Tu Estilo es: {respuestas.estilo}</h2>
              <p className="text-gray-600 mb-6">
                Basado en tus preferencias, te recomendamos productos {respuestas.estilo.toLowerCase()} 
                en tonos {respuestas.colores.join(', ').toLowerCase()}
              </p>
              <button
                onClick={() => navigate('/catalog')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl"
              >
                Ver Productos Recomendados
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
