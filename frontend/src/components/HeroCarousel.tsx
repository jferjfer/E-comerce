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
    <div className="text-center text-white flex flex-col items-center justify-center">
      {/* Animación EGOS */}
      <div className="egos-monogram">E</div>
      <div className="egos-brand">EGOS</div>
      <div className="egos-divider"></div>
      <div className="egos-slogan">Wear Your Truth</div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Prata&display=swap');

        .egos-monogram {
          font-family: 'Bodoni Moda', serif;
          font-size: clamp(120px, 20vw, 220px);
          line-height: 1;
          margin: 0;
          background: linear-gradient(135deg, #c5a47e 0%, #e2c9af 25%, #ffffff 50%, #e2c9af 75%, #a67c52 100%);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 400;
          letter-spacing: -10px;
          opacity: 0;
          filter: blur(20px);
          transform: translateY(20px) scale(0.95);
          animation: egosRevealMain 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     egosShimmer 8s linear infinite;
        }

        .egos-brand {
          font-family: 'Prata', serif;
          font-size: clamp(28px, 5vw, 70px);
          letter-spacing: clamp(10px, 3vw, 30px);
          margin-top: -10px;
          text-transform: uppercase;
          font-weight: 400;
          color: #ffffff;
          opacity: 0;
          filter: blur(10px);
          transform: translateY(10px);
          animation: egosRevealBrand 3s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards;
        }

        .egos-divider {
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c5a47e, transparent);
          margin: 20px auto;
          opacity: 0.5;
          animation: egosExpandDivider 2s ease-in-out 1.5s forwards;
        }

        .egos-slogan {
          font-family: 'Bodoni Moda', serif;
          font-style: italic;
          font-size: clamp(12px, 2vw, 18px);
          letter-spacing: clamp(6px, 2vw, 14px);
          color: #c5a47e;
          text-transform: uppercase;
          opacity: 0;
          animation: egosSlogan 2s ease-out 2.5s forwards;
        }

        @keyframes egosRevealMain {
          to { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
        }
        @keyframes egosShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
        @keyframes egosRevealBrand {
          to { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        @keyframes egosExpandDivider {
          to { width: 120px; }
        }
        @keyframes egosSlogan {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 0.85; transform: translateY(0); }
        }
      `}</style>
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
