import React, { useState } from 'react';
import apiCliente from '../servicios/apiCliente';

function PaginaLogin() {
  const [formulario, setFormulario] = useState({
    email: '',
    contrasena: ''
  });
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e) => {
    console.log('📝 Campo cambiado:', e.target.name, '=', e.target.value);
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    console.log('🚀 Iniciando login...');
    console.log('📝 Datos del formulario:', formulario);

    try {
      const endpoint = esRegistro ? '/auth/registro' : '/auth/login';
      console.log('🔗 Endpoint:', endpoint);
      
      console.log('📡 Enviando petición...');
      const respuesta = await apiCliente.post(endpoint, formulario);
      console.log('✅ Respuesta recibida:', respuesta);
      
      if (respuesta.data.token) {
        console.log('🎉 Token recibido, guardando...');
        localStorage.setItem('tokenUsuario', respuesta.data.token);
        localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));
        alert(esRegistro ? 'Registro exitoso' : 'Inicio de sesión exitoso');
        window.location.href = '/';
      } else {
        console.log('❌ No se recibió token');
      }
    } catch (error) {
      console.error('💥 Error de autenticación:', error);
      console.error('💥 Error completo:', JSON.stringify(error, null, 2));
      alert('Error en la autenticación: ' + error.message);
    } finally {
      setCargando(false);
      console.log('🏁 Proceso terminado');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 max-w-md w-full">
        {/* Card principal */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-105 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <span className="text-4xl">{esRegistro ? '🎆' : '🔑'}</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {esRegistro ? 'Crear Cuenta' : 'Bienvenido'}
            </h2>
            <p className="text-white/70">
              {esRegistro ? 'Únete a nuestra comunidad' : 'Inicia sesión en tu cuenta'}
            </p>
          </div>
          
          <form onSubmit={manejarEnvio} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={manejarCambio}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                🔒 Contraseña
              </label>
              <input
                type="password"
                name="contrasena"
                value={formulario.contrasena}
                onChange={manejarCambio}
                placeholder="Tu contraseña segura"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-white text-purple-600 py-4 px-6 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 shadow-xl"
            >
              {cargando ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                <span>
                  {esRegistro ? '🎆 Crear Cuenta' : '🚀 Iniciar Sesión'}
                </span>
              )}
            </button>
          </form>
          
          {/* Divisor */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="px-4 text-white/60 text-sm">o</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          
          {/* Botones sociales */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300">
              <span>👍</span>
              <span className="text-sm">Google</span>
            </button>
            <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300">
              <span>📱</span>
              <span className="text-sm">Facebook</span>
            </button>
          </div>
          
          {/* Toggle */}
          <div className="text-center">
            <p className="text-white/70 mb-2">
              {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            </p>
            <button 
              type="button" 
              onClick={() => setEsRegistro(!esRegistro)}
              className="text-white font-bold hover:text-yellow-300 transition-colors duration-300 underline decoration-2 underline-offset-4"
            >
              {esRegistro ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-white/20 rounded-full animate-bounce"></div>
        <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-white/20 rounded-full animate-bounce delay-500"></div>
      </div>
    </div>
  );
}

export default PaginaLogin;