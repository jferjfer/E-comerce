import React, { useState, useEffect } from 'react';
import apiCliente from '../servicios/apiCliente';

function PaginaInicio() {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerProductosDestacados();
  }, []);

  const obtenerProductosDestacados = async () => {
    try {
      const respuesta = await apiCliente.get('/productos/destacados');
      setProductosDestacados(respuesta.data.productos || respuesta.data);
    } catch (error) {
      console.error('Error al obtener productos destacados:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-600 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section ÉPICO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Fondo cinematográfico con múltiples capas */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-yellow-500/20 animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent"></div>
        </div>
        
        {/* Sistema de partículas avanzado */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div key={i} 
                 className={`absolute w-1 h-1 bg-white rounded-full animate-pulse`}
                 style={{
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 100}%`,
                   animationDelay: `${Math.random() * 3}s`,
                   animationDuration: `${2 + Math.random() * 3}s`
                 }}>
            </div>
          ))}
        </div>
        
        {/* Elementos 3D flotantes */}
        <div className="absolute inset-0 perspective-1000">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-3xl transform rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-2xl transform -rotate-12 animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/6 w-16 h-16 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-xl transform rotate-12 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        {/* Contenido principal con efectos 3D */}
        <div className="relative z-20 text-center px-6 max-w-6xl mx-auto transform perspective-1000">
          {/* Logo/Título con efectos especiales */}
          <div className="mb-12 transform hover:scale-105 transition-all duration-500">
            <h1 className="text-8xl md:text-9xl font-black mb-4 leading-none">
              <span className="inline-block transform hover:rotate-3 transition-transform duration-300">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl">
                  Style
                </span>
              </span>
              <br/>
              <span className="inline-block transform hover:-rotate-2 transition-transform duration-300">
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
                  Nexus
                </span>
              </span>
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full animate-pulse"></div>
          </div>
          
          {/* Subtítulo con efectos de escritura */}
          <p className="text-3xl md:text-4xl text-white/90 mb-16 font-light leading-relaxed">
            El futuro de la 
            <span className="font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent animate-pulse">
              moda digital
            </span>
            <br/>está aquí
          </p>
          
          {/* Botones con efectos holográficos */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-16">
            <button className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-xl overflow-hidden transform hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-purple-500/50">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
              <span className="relative z-10 flex items-center justify-center space-x-3">
                <span>🚀</span>
                <span>Explorar Universo</span>
              </span>
            </button>
            
            <button className="group relative px-12 py-6 border-2 border-white/50 text-white rounded-2xl font-bold text-xl backdrop-blur-sm hover:bg-white/10 transform hover:scale-110 transition-all duration-500">
              <span className="flex items-center justify-center space-x-3">
                <span>🎬</span>
                <span>Ver Experiencia</span>
              </span>
            </button>
          </div>
          
          {/* Stats impresionantes */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-black text-white mb-2">1M+</div>
              <div className="text-white/70 text-sm">Usuarios Activos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-white mb-2">50K+</div>
              <div className="text-white/70 text-sm">Productos Únicos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-white mb-2">99%</div>
              <div className="text-white/70 text-sm">Satisfacción</div>
            </div>
          </div>
        </div>
        
        {/* Indicador de scroll mejorado */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center space-y-2">
            <div className="text-white/70 text-sm font-medium">Descubre más</div>
            <div className="w-8 h-12 border-2 border-white/50 rounded-full flex justify-center backdrop-blur-sm">
              <div className="w-1 h-4 bg-white rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Efectos de luz lateral */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-purple-400/50 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-pink-400/50 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
      </section>
      
      {/* Productos Destacados */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ✨ Productos Destacados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre nuestra selección curada de productos que están marcando tendencia
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {productosDestacados.map((producto, index) => (
              <div key={producto.id} className="group relative transform-gpu perspective-1000">
                {/* Card principal con efectos holográficos */}
                <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-8 hover:rotate-y-12 transition-all duration-700 border border-white/30 overflow-hidden">
                  
                  {/* Efecto holográfico de fondo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Borde animado */}
                  <div className="absolute inset-0 rounded-3xl">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                  </div>
                  
                  {/* Contenido */}
                  <div className="relative z-10">
                    {/* Imagen con efectos 3D */}
                    <div className="relative overflow-hidden rounded-2xl mb-8 transform group-hover:scale-105 transition-transform duration-500">
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre} 
                        className="w-full h-72 object-cover transform group-hover:scale-110 transition-transform duration-700" 
                      />
                      
                      {/* Overlay con efectos */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Efectos de partículas en hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} 
                               className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                               style={{
                                 left: `${20 + (i * 10)}%`,
                                 top: `${20 + (i * 8)}%`,
                                 animationDelay: `${i * 0.2}s`
                               }}>
                          </div>
                        ))}
                      </div>
                      
                      {/* Botones flotantes */}
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                        <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-300">
                          ❤️
                        </button>
                        <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-300">
                          👁️
                        </button>
                      </div>
                      
                      {/* Badge de categoría */}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                        Trending
                      </div>
                    </div>
                    
                    {/* Información del producto */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-black text-2xl text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-500">
                          {producto.nombre}
                        </h3>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-yellow-400 text-sm">⭐</span>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-white/70 text-base leading-relaxed">
                        {producto.descripcion}
                      </p>
                      
                      {/* Precio y acción */}
                      <div className="flex items-center justify-between pt-4">
                        <div className="space-y-1">
                          <div className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                            ${producto.precio}
                          </div>
                          <div className="text-white/50 text-sm line-through">
                            ${(producto.precio * 1.3).toFixed(2)}
                          </div>
                        </div>
                        
                        <button className="group/btn relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg overflow-hidden transform hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-purple-500/50">
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                          <span className="relative z-10 flex items-center space-x-2">
                            <span>🛒</span>
                            <span>Agregar</span>
                          </span>
                        </button>
                      </div>
                      
                      {/* Barra de popularidad */}
                      <div className="pt-4">
                        <div className="flex items-center justify-between text-sm text-white/70 mb-2">
                          <span>Popularidad</span>
                          <span>94%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '94%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Efectos de luz */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-500"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-500" style={{animationDelay: '0.5s'}}></div>
                </div>
                
                {/* Sombra proyectada */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 transform translate-y-8"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Sección de características */}
      <section className="py-20 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Envío Gratis</h3>
              <p className="text-gray-600">En compras mayores a $50</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Pago Seguro</h3>
              <p className="text-gray-600">Protección total en tus compras</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🔄</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Devoluciones</h3>
              <p className="text-gray-600">30 días para cambios</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PaginaInicio;