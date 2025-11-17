const pool = require('../config/baseDatos');

class Carrito {
  static async obtenerPorUsuario(idUsuario) {
    const consulta = 'SELECT * FROM carrito WHERE id_usuario = $1';
    const resultado = await pool.query(consulta, [idUsuario]);
    return resultado.rows[0];
  }

  static async crear(idUsuario) {
    const consulta = `
      INSERT INTO carrito (id_usuario)
      VALUES ($1)
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
    const consulta = `
      SELECT cp.*, cp.cantidad * cp.precio_unitario as subtotal
      FROM carrito_producto cp
      WHERE cp.id_carrito = $1
    `;
    const resultado = await pool.query(consulta, [idCarrito]);
    return resultado.rows;
  }

  static async agregarProducto(idCarrito, idProducto, cantidad, precioUnitario) {
    // Verificar si el producto ya existe en el carrito
    const consultaExistente = `
      SELECT * FROM carrito_producto 
      WHERE id_carrito = $1 AND id_producto = $2
    `;
    const existente = await pool.query(consultaExistente, [idCarrito, idProducto]);

    if (existente.rows.length > 0) {
      // Actualizar cantidad
      const consultaActualizar = `
        UPDATE carrito_producto 
        SET cantidad = cantidad + $1, precio_unitario = $2
        WHERE id_carrito = $3 AND id_producto = $4
        RETURNING *
      `;
      const resultado = await pool.query(consultaActualizar, [cantidad, precioUnitario, idCarrito, idProducto]);
      return resultado.rows[0];
    } else {
      // Insertar nuevo producto
      const consultaInsertar = `
        INSERT INTO carrito_producto (id_carrito, id_producto, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const resultado = await pool.query(consultaInsertar, [idCarrito, idProducto, cantidad, precioUnitario]);
      return resultado.rows[0];
    }
  }

  static async actualizarCantidad(idCarrito, idProducto, nuevaCantidad) {
    if (nuevaCantidad <= 0) {
      return await this.eliminarProducto(idCarrito, idProducto);
    }

    const consulta = `
      UPDATE carrito_producto 
      SET cantidad = $1
      WHERE id_carrito = $2 AND id_producto = $3
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [nuevaCantidad, idCarrito, idProducto]);
    return resultado.rows[0];
  }

  static async eliminarProducto(idCarrito, idProducto) {
    const consulta = `
      DELETE FROM carrito_producto 
      WHERE id_carrito = $1 AND id_producto = $2
    `;
    const resultado = await pool.query(consulta, [idCarrito, idProducto]);
    return resultado.rowCount > 0;
  }

  static async vaciar(idCarrito) {
    const consulta = 'DELETE FROM carrito_producto WHERE id_carrito = $1';
    const resultado = await pool.query(consulta, [idCarrito]);
    return resultado.rowCount;
  }

  static async calcularTotal(idCarrito) {
    const consulta = `
      SELECT COALESCE(SUM(cantidad * precio_unitario), 0) as total
      FROM carrito_producto 
      WHERE id_carrito = $1
    `;
    const resultado = await pool.query(consulta, [idCarrito]);
    return parseFloat(resultado.rows[0].total);
  }
}

module.exports = Carrito;