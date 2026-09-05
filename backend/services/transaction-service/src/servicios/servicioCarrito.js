const Carrito = require('../modelos/Carrito');
const axios = require('axios');

class ServicioCarrito {
  static async obtenerCarrito(idUsuario) {
    const carrito = await Carrito.obtenerOCrear(idUsuario);
    const productos = await Carrito.obtenerProductos(carrito.id);
    const total = await Carrito.calcularTotal(carrito.id);

    return {
      carrito,
      productos,
      total,
      cantidad_items: productos.length
    };
  }

  static async agregarProducto(idUsuario, idProducto, cantidad = 1) {
    // Verificar que el producto existe (llamada al servicio de catálogo)
    try {
      const urlCatalogo = process.env.SERVICIO_CATALOGO_URL || 'http://localhost:3002';
      const respuestaProducto = await axios.get(`${urlCatalogo}/api/productos/${idProducto}`);
      const producto = respuestaProducto.data;

      if (!producto.activo) {
        throw new Error('El producto no está disponible');
      }

      const carrito = await Carrito.obtenerOCrear(idUsuario);
      const productoAgregado = await Carrito.agregarProducto(
        carrito.id, 
        idProducto, 
        cantidad, 
        producto.precio,
        null, // talla
        null  // color
      );

      return {
        mensaje: 'Producto agregado al carrito exitosamente',
        producto: productoAgregado
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Producto no encontrado');
      }
      throw error;
    }
  }

  static async actualizarCantidad(idUsuario, idProducto, nuevaCantidad) {
    const carrito = await Carrito.obtenerPorUsuario(idUsuario);
    if (!carrito) {
      throw new Error('Carrito no encontrado');
    }

    const productoActualizado = await Carrito.actualizarCantidad(
      carrito.id, 
      idProducto, 
      nuevaCantidad
    );

    if (!productoActualizado && nuevaCantidad > 0) {
      throw new Error('Producto no encontrado en el carrito');
    }

    return {
      mensaje: nuevaCantidad > 0 ? 'Cantidad actualizada' : 'Producto eliminado del carrito',
      producto: productoActualizado
    };
  }

  static async eliminarProducto(idUsuario, idProducto) {
    const carrito = await Carrito.obtenerPorUsuario(idUsuario);
    if (!carrito) {
      throw new Error('Carrito no encontrado');
    }

    const eliminado = await Carrito.eliminarProducto(carrito.id, idProducto);
    if (!eliminado) {
      throw new Error('Producto no encontrado en el carrito');
    }

    return {
      mensaje: 'Producto eliminado del carrito exitosamente'
    };
  }

  static async vaciarCarrito(idUsuario) {
    const carrito = await Carrito.obtenerPorUsuario(idUsuario);
    if (!carrito) {
      throw new Error('Carrito no encontrado');
    }

    const productosEliminados = await Carrito.vaciar(carrito.id);
    
    return {
      mensaje: 'Carrito vaciado exitosamente',
      productos_eliminados: productosEliminados
    };
  }
}

module.exports = ServicioCarrito;