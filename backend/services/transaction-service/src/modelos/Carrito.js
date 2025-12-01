const pool = require('../config/baseDatos');

class Carrito {
  static async obtenerPorUsuario(idUsuario) {
    const consulta = 'SELECT * FROM carrito WHERE usuario_id = $1';
    const resultado = await pool.query(consulta, [idUsuario]);
    return resultado.rows[0];
  }

  static async crear(idUsuario) {
    const consulta = `
      INSERT INTO carrito (usuario_id, productos, total)
      VALUES ($1, '[]'::jsonb, 0)
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [idUsuario]);
    return resultado.rows[0];
  }

  static async obtenerOCrear(idUsuario) {
    let carrito = await this.obtenerPorUsuario(idUsuario);
    if (!carrito) {
      carrito = await this.crear(idUsuario);
    }
    return carrito;
  }

  static async obtenerProductos(idCarrito) {
    const carrito = await pool.query('SELECT productos FROM carrito WHERE id = $1', [idCarrito]);
    return carrito.rows[0]?.productos || [];
  }

  static async agregarProducto(idCarrito, idProducto, cantidad, precioUnitario, talla = null, color = null) {
    const carrito = await pool.query('SELECT productos, total FROM carrito WHERE id = $1', [idCarrito]);
    let productos = carrito.rows[0].productos;
    
    const productoExistente = productos.find(p => p.id === idProducto);
    
    if (productoExistente) {
      productoExistente.cantidad += cantidad;
    } else {
      productos.push({
        id: idProducto,
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        talla: talla,
        color: color
      });
    }
    
    const nuevoTotal = productos.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0);
    
    await pool.query(
      'UPDATE carrito SET productos = $1, total = $2 WHERE id = $3',
      [JSON.stringify(productos), nuevoTotal, idCarrito]
    );
    
    return productoExistente || productos[productos.length - 1];
  }

  static async actualizarCantidad(idCarrito, idProducto, nuevaCantidad) {
    if (nuevaCantidad <= 0) {
      return await this.eliminarProducto(idCarrito, idProducto);
    }

    const carrito = await pool.query('SELECT productos FROM carrito WHERE id = $1', [idCarrito]);
    let productos = carrito.rows[0].productos;
    
    const producto = productos.find(p => p.id === idProducto);
    if (producto) {
      producto.cantidad = nuevaCantidad;
      const nuevoTotal = productos.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0);
      
      await pool.query(
        'UPDATE carrito SET productos = $1, total = $2 WHERE id = $3',
        [JSON.stringify(productos), nuevoTotal, idCarrito]
      );
    }
    return producto;
  }

  static async eliminarProducto(idCarrito, idProducto) {
    const carrito = await pool.query('SELECT productos FROM carrito WHERE id = $1', [idCarrito]);
    let productos = carrito.rows[0].productos;
    
    productos = productos.filter(p => p.id !== idProducto);
    const nuevoTotal = productos.reduce((sum, p) => sum + (p.cantidad * p.precio_unitario), 0);
    
    await pool.query(
      'UPDATE carrito SET productos = $1, total = $2 WHERE id = $3',
      [JSON.stringify(productos), nuevoTotal, idCarrito]
    );
    
    return true;
  }

  static async vaciar(idCarrito) {
    await pool.query(
      'UPDATE carrito SET productos = $1, total = 0 WHERE id = $2',
      ['[]', idCarrito]
    );
    return 0;
  }

  static async calcularTotal(idCarrito) {
    const carrito = await pool.query('SELECT total FROM carrito WHERE id = $1', [idCarrito]);
    return parseFloat(carrito.rows[0]?.total || 0);
  }
}

module.exports = Carrito;