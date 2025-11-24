const pool = require('../config/baseDatos');
const bcrypt = require('bcryptjs');

class Usuario {
  static async crear(datosUsuario) {
    const { nombre, email, contrasena, rol = 'cliente' } = datosUsuario;
    const contrasenaHasheada = await bcrypt.hash(contrasena, 12);
    
    const consulta = `
      INSERT INTO usuario (nombre, email, contrasena, rol)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, email, rol, fecha_creacion
    `;
    
    const resultado = await pool.query(consulta, [nombre, email, contrasenaHasheada, rol]);
    return resultado.rows[0];
  }

  static async buscarPorEmail(email) {
    const consulta = 'SELECT * FROM usuario WHERE email = $1';
    const resultado = await pool.query(consulta, [email]);
    return resultado.rows[0];
  }

  static async buscarPorId(id) {
    const consulta = `
      SELECT id, nombre, email, rol, total_compras_historico, fecha_creacion, fecha_actualizacion
      FROM usuario WHERE id = $1
    `;
    const resultado = await pool.query(consulta, [id]);
    return resultado.rows[0];
  }

  static async verificarContrasena(contrasenaTexto, contrasenaHasheada) {
    return await bcrypt.compare(contrasenaTexto, contrasenaHasheada);
  }

  static async actualizarTotalCompras(idUsuario, nuevoTotal) {
    const consulta = `
      UPDATE usuario 
      SET total_compras_historico = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING total_compras_historico
    `;
    const resultado = await pool.query(consulta, [nuevoTotal, idUsuario]);
    return resultado.rows[0];
  }

  static async guardarTokenRecuperacion(usuarioId, token, expiracion) {
    const consulta = `
      UPDATE usuario 
      SET token_recuperacion = $1, token_expiracion = $2, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await pool.query(consulta, [token, expiracion, usuarioId]);
  }

  static async buscarPorTokenRecuperacion(token) {
    const consulta = `
      SELECT id, nombre, email, token_expiracion 
      FROM usuario 
      WHERE token_recuperacion = $1
    `;
    const resultado = await pool.query(consulta, [token]);
    return resultado.rows[0];
  }

  static async actualizarContrasena(usuarioId, nuevaContrasena) {
    const consulta = `
      UPDATE usuario 
      SET contrasena = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(consulta, [nuevaContrasena, usuarioId]);
  }

  static async limpiarTokenRecuperacion(usuarioId) {
    const consulta = `
      UPDATE usuario 
      SET token_recuperacion = NULL, token_expiracion = NULL, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(consulta, [usuarioId]);
  }
}

module.exports = Usuario;