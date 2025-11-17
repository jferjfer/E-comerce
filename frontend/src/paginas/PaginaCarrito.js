import React, { useState, useEffect } from 'react';
import apiCliente from '../servicios/apiCliente';

function PaginaCarrito() {
  const [carrito, setCarrito] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerCarrito();
  }, []);

  const obtenerCarrito = async () => {
    try {
      const respuesta = await apiCliente.get('/transaction/carrito');
      setCarrito(respuesta.data);
    } catch (error) {
      console.error('Error al obtener carrito:', error);
    } finally {
      setCargando(false);
    }
  };

  const actualizarCantidad = async (itemId, nuevaCantidad) => {
    try {
      await apiCliente.put(`/transaction/carrito/item/${itemId}`, {
        cantidad: nuevaCantidad
      });
      obtenerCarrito();
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    }
  };

  const eliminarItem = async (itemId) => {
    try {
      await apiCliente.delete(`/transaction/carrito/item/${itemId}`);
      obtenerCarrito();
    } catch (error) {
      console.error('Error al eliminar item:', error);
    }
  };

  const procesarPago = async () => {
    try {
      const respuesta = await apiCliente.post('/transaction/pedidos/crear', {
        carritoId: carrito.id
      });
      alert('Pedido creado exitosamente');
      obtenerCarrito();
    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Error al procesar el pedido');
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando carrito...</div>
      </div>
    );
  }

  if (!carrito || !carrito.items || carrito.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega algunos productos para comenzar</p>
          <a href="/productos" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Ver Productos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Mi Carrito</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {carrito.items.map(item => (
            <div key={item.id} className="flex items-center border-b border-gray-200 py-4 last:border-b-0">
              <img src={item.producto.imagen} alt={item.producto.nombre} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1 ml-4">
                <h3 className="font-semibold text-lg text-gray-800">{item.producto.nombre}</h3>
                <p className="text-blue-600 font-bold">${item.producto.precio}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  -
                </button>
                <span className="font-semibold text-lg">{item.cantidad}</span>
                <button 
                  onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  +
                </button>
              </div>
              <button 
                onClick={() => eliminarItem(item.id)}
                className="ml-4 text-red-600 hover:text-red-800 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">Total: ${carrito.total}</h3>
          </div>
          <button 
            onClick={procesarPago} 
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
          >
            Procesar Pago
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaginaCarrito;