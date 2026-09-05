const pool = require('../config/baseDatos');

class SesionUsuario {
  static async crear(idUsuario, token, fechaExpiracion) {
    const consulta = `
      INSERT INTO sesion_usuario (id_usuario, token, fecha_expiracion)
      VALUES ($1, $2, $3)
      RETURNING id, fecha_creacion
    `;
    
    const resultado = await pool.query(consulta, [idUsuario, token, fechaExpiracion]);
    return resultado.rows[0];
  }

  static async buscarPorToken(token) {
    const consulta = `
      SELECT su.*, u.nombre, u.email, u.rol
      FROM sesion_usuario su
      JOIN usuario u ON su.id_usuario = u.id
      WHERE su.token = $1 AND su.fecha_expiracion > NOW()
    `;
    
    const resultado = await pool.query(consulta, [token]);
    return resultado.rows[0];
  }

  static async eliminarPorToken(token) {
    const consulta = 'DELETE FROM sesion_usuario WHERE token = $1';
    await pool.query(consulta, [token]);
  }

  static async eliminarSesionesExpiradas() {
    const consulta = 'DELETE FROM sesion_usuario WHERE fecha_expiracion <= NOW()';
    const resultado = await pool.query(consulta);
    return resultado.rowCount;
  }
}

module.exports = SesionUsuario;