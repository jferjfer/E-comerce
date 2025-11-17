import React, { useEffect } from 'react';
import { BrowserRouter as Enrutador, Routes, Route } from 'react-router-dom';
import BarraNavegacion from './componentes/BarraNavegacion';
import PaginaInicio from './paginas/PaginaInicio';
import PaginaProductos from './paginas/PaginaProductos';
import PaginaCarrito from './paginas/PaginaCarrito';
import PaginaLogin from './paginas/PaginaLogin';
import WebSocketService from './servicios/websocket';

function Aplicacion() {
  useEffect(() => {
    // Conectar WebSocket al iniciar la aplicación
    WebSocketService.conectar();
    
    // Limpiar al desmontar
    return () => {
      WebSocketService.desconectar();
    };
  }, []);

  return (
    <Enrutador>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <BarraNavegacion />
        <main className="relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<PaginaInicio />} />
              <Route path="/productos" element={<PaginaProductos />} />
              <Route path="/carrito" element={<PaginaCarrito />} />
              <Route path="/login" element={<PaginaLogin />} />
            </Routes>
          </div>
        </main>
      </div>
    </Enrutador>
  );
}

export default Aplicacion;