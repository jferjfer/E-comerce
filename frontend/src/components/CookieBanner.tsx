import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface CookiePrefs {
  esenciales: true
  rendimiento: boolean
  funcionalidad: boolean
}

const COOKIE_KEY = 'egos_cookie_consent'

export function useCookieConsent() {
  const [prefs, setPrefs] = useState<CookiePrefs | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_KEY)
    if (saved) setPrefs(JSON.parse(saved))
  }, [])

  const guardar = (p: CookiePrefs) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(p))
    setPrefs(p)
  }

  return { prefs, guardar, aceptado: prefs !== null }
}

export default function CookieBanner() {
  const { aceptado, guardar } = useCookieConsent()
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [rendimiento, setRendimiento] = useState(true)
  const [funcionalidad, setFuncionalidad] = useState(true)

  if (aceptado) return null

  const aceptarTodas = () => guardar({ esenciales: true, rendimiento: true, funcionalidad: true })
  const rechazarOpcionales = () => guardar({ esenciales: true, rendimiento: false, funcionalidad: false })
  const guardarPersonalizadas = () => guardar({ esenciales: true, rendimiento, funcionalidad })

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4">
      <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

        {!mostrarOpciones ? (
          /* Vista principal */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl flex-shrink-0">🍪</span>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">Usamos cookies</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Usamos cookies para mejorar tu experiencia. Las esenciales son necesarias para el funcionamiento del sitio.{' '}
                  <Link to="/cookies" className="text-gold underline hover:text-gold-light">
                    Política de cookies
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setMostrarOpciones(true)}
                className="flex-1 sm:flex-none text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl border border-white/10 hover:border-white/30 transition-colors"
              >
                Personalizar
              </button>
              <button
                onClick={rechazarOpcionales}
                className="flex-1 sm:flex-none text-xs text-gray-300 hover:text-white px-3 py-2 rounded-xl border border-white/10 hover:border-white/30 transition-colors"
              >
                Solo esenciales
              </button>
              <button
                onClick={aceptarTodas}
                className="flex-1 sm:flex-none text-xs font-semibold bg-gold text-black px-4 py-2 rounded-xl hover:bg-gold-light transition-colors"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        ) : (
          /* Vista personalización */
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Personalizar cookies</p>
              <button onClick={() => setMostrarOpciones(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            <div className="space-y-3">
              {/* Esenciales — siempre activas */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-white">🔒 Esenciales</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Sesión, carrito, seguridad. Siempre activas.</p>
                </div>
                <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end px-0.5 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>

              {/* Rendimiento */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-white">📊 Rendimiento</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Análisis anónimo para mejorar el sitio.</p>
                </div>
                <button
                  onClick={() => setRendimiento(!rendimiento)}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${rendimiento ? 'bg-emerald-500 justify-end' : 'bg-gray-600 justify-start'}`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>

              {/* Funcionalidad */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-white">🎯 Funcionalidad</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Preferencias, tallas, productos vistos.</p>
                </div>
                <button
                  onClick={() => setFuncionalidad(!funcionalidad)}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${funcionalidad ? 'bg-emerald-500 justify-end' : 'bg-gray-600 justify-start'}`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={rechazarOpcionales}
                className="flex-1 text-xs text-gray-300 py-2 rounded-xl border border-white/10 hover:border-white/30 transition-colors"
              >
                Solo esenciales
              </button>
              <button
                onClick={guardarPersonalizadas}
                className="flex-1 text-xs font-semibold bg-gold text-black py-2 rounded-xl hover:bg-gold-light transition-colors"
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
