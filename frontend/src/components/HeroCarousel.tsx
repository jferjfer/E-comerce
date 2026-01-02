import { useState, useEffect } from 'react'

export default function HeroCarousel() {
  const [items, setItems] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch('http://localhost:3006/api/campanas')
        const campanas = (await res.json()).campanas?.filter((c: any) => c.estado === 'Activa') || []
        setItems(campanas)
      } catch (e) {}
    }
    cargar()
    const interval = setInterval(cargar, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) return (
    <div className="text-center text-white">
      <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Estilo y Moda</h1>
      <p className="text-xl opacity-90">Descubre tu estilo único. Moda para todos sin límites.</p>
    </div>
  )

  const item = items[currentIndex]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 overflow-hidden">
        <div className="relative z-10 animate-fadeIn">
          <div className="text-center text-white">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1 rounded-full text-sm font-bold mb-4">
              🎉 CAMPAÑA ESPECIAL
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-3">{item.nombre}</h2>
            <p className="text-xl mb-6 opacity-90">{item.descripcion}</p>
            <div className="inline-block bg-white text-red-600 px-8 py-3 rounded-xl font-bold text-3xl shadow-lg">
              HASTA 50% OFF
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="flex gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  )
}
