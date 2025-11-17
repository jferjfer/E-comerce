import React, { useState, useEffect } from 'react';
import apiCliente from '../servicios/apiCliente';

function PaginaProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerProductos();
    obtenerCategorias();
  }, []);

  const obtenerProductos = async () => {
    try {
      const respuesta = await apiCliente.get('/productos');
      setProductos(respuesta.data.productos || respuesta.data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    } finally {
      setCargando(false);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const respuesta = await apiCliente.get('/categorias');
      setCategorias(respuesta.data.categorias || respuesta.data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  const agregarAlCarrito = async (productoId) => {
    try {
      await apiCliente.post('/carrito/agregar', {
        productoId,
        cantidad: 1
      });
      alert('Producto agregado al carrito');
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Error al agregar producto');
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando productos...</div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Productos</h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-lg text-gray-600 mb-4">No hay productos disponibles</div>
              <div className="text-sm text-gray-500">Los productos se están cargando...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Productos</h1>
        
        <div className="mb-8 flex justify-center">
          <select 
            value={categoriaSeleccionada} 
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(categoria => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map(producto => (
            <div key={producto.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <img src={producto.imagen} alt={producto.nombre} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">{producto.nombre}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{producto.descripcion}</p>
                <p className="text-2xl font-bold text-blue-600 mb-4">${producto.precio}</p>
                <button 
                  onClick={() => agregarAlCarrito(producto.id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PaginaProductos;