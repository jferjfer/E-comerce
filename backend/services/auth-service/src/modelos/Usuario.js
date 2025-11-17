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
}

module.exports = Usuario;