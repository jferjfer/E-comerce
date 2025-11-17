import React from 'react';
import { Link } from 'react-router-dom';

function BarraNavegacion() {
  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-500">
      {/* Fondo con efectos */}
      <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-r from-black/20 via-purple-900/30 to-black/20 border-b border-white/10"></div>
      
      {/* Efectos de luz superior */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-24">
          {/* Logo futurista */}
          <Link to="/" className="group flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                <span className="text-white font-bold text-2xl">⚡</span>
              </div>
              {/* Anillo de energía */}
              <div className="absolute inset-0 rounded-2xl border-2 border-purple-400/50 animate-ping"></div>
            </div>
            
            <div className="space-y-1">
              <span className="text-3xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                StyleNexus
              </span>
              <div className="text-xs text-white/60 font-medium tracking-widest">
                FUTURE FASHION
              </div>
            </div>
          </Link>
          
          {/* Menú futurista */}
          <ul className="flex items-center space-x-1">
            <li>
              <Link to="/" className="group relative px-6 py-3 rounded-2xl text-white/80 hover:text-white transition-all duration-300 font-medium overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center space-x-2">
                  <span className="text-lg">🌌</span>
                  <span>Inicio</span>
                </span>
              </Link>
            </li>
            
            <li>
              <Link to="/productos" className="group relative px-6 py-3 rounded-2xl text-white/80 hover:text-white transition-all duration-300 font-medium overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center space-x-2">
                  <span className="text-lg">🔮</span>
                  <span>Productos</span>
                </span>
              </Link>
            </li>
            
            <li>
              <Link to="/carrito" className="group relative px-6 py-3 rounded-2xl text-white/80 hover:text-white transition-all duration-300 font-medium overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center space-x-2">
                  <span className="text-lg relative">
                    🛍️
                    {/* Badge futurista */}
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse border-2 border-white/30">
                      3
                    </span>
                  </span>
                  <span>Carrito</span>
                </span>
              </Link>
            </li>
            
            {/* Botón de cuenta premium */}
            <li>
              <Link to="/login" className="group relative ml-4 px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-2xl font-bold overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-purple-500/50">
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                
                <span className="relative z-10 flex items-center space-x-2">
                  <span className="text-lg">🚀</span>
                  <span>Acceder</span>
                </span>
                
                {/* Partículas */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} 
                         className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                         style={{
                           left: `${20 + (i * 12)}%`,
                           top: `${30 + (i * 8)}%`,
                           animationDelay: `${i * 0.1}s`
                         }}>
                    </div>
                  ))}
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Línea de energía inferior */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
    </nav>
  );
}

export default BarraNavegacion;