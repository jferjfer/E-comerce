const pool = require('../config/baseDatos');

class Pedido {
  static async crear(idUsuario, estado, total) {
    const consulta = `
      INSERT INTO pedido (id_usuario, estado, total)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [idUsuario, estado, total]);
    return resultado.rows[0];
  }

  static async obtenerPorId(idPedido) {
    const consulta = 'SELECT * FROM pedido WHERE id = $1';
    const resultado = await pool.query(consulta, [idPedido]);
    return resultado.rows[0];
  }

  static async obtenerPorUsuario(idUsuario, limite = 10, offset = 0) {
    const consulta = `
      SELECT * FROM pedido 
      WHERE id_usuario = $1 
      ORDER BY fecha_creacion DESC
      LIMIT $2 OFFSET $3
    `;
    const resultado = await pool.query(consulta, [idUsuario, limite, offset]);
    return resultado.rows;
  }

  static async agregarProducto(idPedido, idProducto, cantidad, precioUnitario) {
    const subtotal = cantidad * precioUnitario;
    const consulta = `
      INSERT INTO pedido_producto (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [idPedido, idProducto, cantidad, precioUnitario, subtotal]);
    return resultado.rows[0];
  }

  static async obtenerProductos(idPedido) {
    const consulta = `
      SELECT pp.*
      FROM pedido_producto pp
      WHERE pp.id_pedido = $1
    `;
    const resultado = await pool.query(consulta, [idPedido]);
    return resultado.rows;
  }

  static async actualizarEstado(idPedido, nuevoEstado) {
    const consulta = `
      UPDATE pedido 
      SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [nuevoEstado, idPedido]);
    return resultado.rows[0];
  }

  static async establecerFechaEntrega(idPedido, fechaEntrega) {
    const consulta = `
      UPDATE pedido 
      SET fecha_entrega = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [fechaEntrega, idPedido]);
    return resultado.rows[0];
  }

  static async contarPorUsuario(idUsuario) {
    const consulta = 'SELECT COUNT(*) as total FROM pedido WHERE id_usuario = $1';
    const resultado = await pool.query(consulta, [idUsuario]);
    return parseInt(resultado.rows[0].total);
  }
}

module.exports = Pedido;