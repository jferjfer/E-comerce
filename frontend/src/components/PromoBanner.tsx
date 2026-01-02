import { useState, useEffect } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function PromoBanner() {
  const [cupones, setCupones] = useState<any[]>([])
  const [campanas, setCampanas] = useState<any[]>([])
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    fetch('http://localhost:3006/api/cupones')
      .then(res => res.json())
      .then(data => setCupones(data.cupones?.filter((c: any) => c.activo).slice(0, 2) || []))
      .catch(() => {})
    
    fetch('http://localhost:3006/api/campanas')
      .then(res => res.json())
      .then(data => setCampanas(data.campanas?.filter((c: any) => c.activa).slice(0, 1) || []))
      .catch(() => {})
  }, [])

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo)
    addNotification(`Código ${codigo} copiado`, 'success')
  }

  if (cupones.length === 0 && campanas.length === 0) return null

  return (
    <section className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 py-8 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Título con animación */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              🎉 Promociones Activas
            </h2>
            <div className="h-1 bg-white/30 rounded-full">
              <div className="h-1 bg-white rounded-full w-2/3 mx-auto animate-pulse"></div>
            </div>
          </div>
          <p className="text-white/90 mt-3 text-lg">Aprovecha estos descuentos exclusivos</p>
        </div>

        {/* Grid de cupones y campañas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Campañas */}
          {campanas.map((campana) => (
            <div 
              key={campana.id}
              className="md:col-span-3 group relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10 p-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-semibold mb-3">
                      🎉 CAMPAÑA ESPECIAL
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-3">{campana.nombre}</h3>
                    <p className="text-lg text-white/90 mb-4">{campana.descripcion}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        📅 {new Date(campana.fecha_inicio).toLocaleDateString()} - {new Date(campana.fecha_fin).toLocaleDateString()}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        💰 Presupuesto: ${campana.presupuesto?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold text-2xl shadow-lg">
                      HASTA 50% OFF
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Cupones */}
          {cupones.map((cupon, idx) => (
            <div 
              key={cupon.id}
              className="group relative bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 hover:shadow-pink-500/50"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Badge de descuento */}
              <div className="absolute top-4 right-4 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                {cupon.tipo === 'porcentaje' ? `${cupon.valor}% OFF` : `$${cupon.valor}`}
              </div>

              <div className="p-6">
                {/* Icono */}
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <i className="fas fa-gift text-3xl text-pink-600"></i>
                </div>

                {/* Descripción */}
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                  {cupon.descripcion}
                </h3>

                {/* Código con diseño de cupón */}
                <div className="relative mt-4 mb-4">
                  <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-pink-50 group-hover:bg-pink-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Código:</p>
                        <p className="text-2xl font-mono font-bold text-pink-600 tracking-wider">
                          {cupon.codigo}
                        </p>
                      </div>
                      <button
                        onClick={() => copiarCodigo(cupon.codigo)}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
                        title="Copiar código"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* Círculos decorativos de cupón */}
                  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                  <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                </div>

                {/* Info adicional */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
                  <span className="flex items-center">
                    <i className="fas fa-shopping-bag mr-2 text-pink-500"></i>
                    Mín: ${cupon.minimo_compra}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-users mr-2 text-purple-500"></i>
                    {cupon.usos_actuales}/{cupon.usos_maximos}
                  </span>
                </div>
              </div>

              {/* Barra de progreso de usos */}
              <div className="h-2 bg-gray-200">
                <div 
                  className="h-2 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(cupon.usos_actuales / cupon.usos_maximos) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-sm">
            * Aplica términos y condiciones. Válido hasta agotar existencias.
          </p>
        </div>
      </div>
    </section>
  )
}
