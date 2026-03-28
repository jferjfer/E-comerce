const pool = require('../config/baseDatos');
const bcrypt = require('bcryptjs');

// Función helper para retry
async function queryConRetry(consulta, params, reintentos = 2) {
  for (let i = 0; i < reintentos; i++) {
    try {
      return await pool.query(consulta, params);
    } catch (error) {
      if (i === reintentos - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

class Usuario {
  static async crear(datosUsuario) {
    const {
      nombre, apellido, email, contrasena, rol = 'cliente',
      documento_tipo, documento_numero, telefono,
      fecha_nacimiento, genero, direccion, ciudad,
      departamento, acepta_terminos, acepta_datos, acepta_marketing
    } = datosUsuario;

    const contrasenaHasheada = await bcrypt.hash(contrasena, 8);

    const consulta = `
      INSERT INTO usuarios (
        nombre, apellido, email, password, rol,
        documento_tipo, documento_numero, telefono,
        fecha_nacimiento, genero, direccion, ciudad,
        departamento, acepta_terminos, acepta_datos, acepta_marketing
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id, nombre, apellido, email, rol, fecha_creacion
    `;

    const resultado = await pool.query(consulta, [
      nombre, apellido || null, email, contrasenaHasheada, rol,
      documento_tipo || null, documento_numero || null, telefono || null,
      fecha_nacimiento || null, genero || null, direccion || null, ciudad || null,
      departamento || null,
      acepta_terminos || false, acepta_datos || false, acepta_marketing || false
    ]);
    return resultado.rows[0];
  }

  static async buscarPorEmail(email) {
    const consulta = 'SELECT id, nombre, email, password as contrasena, rol FROM usuarios WHERE email = $1';
    const resultado = await queryConRetry(consulta, [email]);
    return resultado.rows[0];
  }

  static async buscarPorId(id) {
    const consulta = `
      SELECT id, nombre, apellido, email, rol, telefono, direccion, ciudad,
             total_compras_historico, fecha_creacion, fecha_actualizacion,
             documento_tipo, documento_numero
      FROM usuarios WHERE id = $1
    `;
    const resultado = await pool.query(consulta, [id]);
    return resultado.rows[0];
  }

  static async verificarContrasena(contrasenaTexto, contrasenaHasheada) {
    return await bcrypt.compare(contrasenaTexto, contrasenaHasheada);
  }

  static async actualizarTotalCompras(idUsuario, montoAgregar) {
    const consulta = `
      UPDATE usuarios 
      SET total_compras_historico = total_compras_historico + $1,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING total_compras_historico
    `;
    const resultado = await pool.query(consulta, [montoAgregar, idUsuario]);
    return resultado.rows[0];
  }

  static async guardarTokenRecuperacion(usuarioId, token, expiracion) {
    const consulta = `
      UPDATE usuarios 
      SET token_recuperacion = $1, token_expiracion = $2, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await pool.query(consulta, [token, expiracion, usuarioId]);
  }

  static async buscarPorTokenRecuperacion(token) {
    const consulta = `
      SELECT id, nombre, email, token_expiracion 
      FROM usuarios 
      WHERE token_recuperacion = $1
    `;
    const resultado = await pool.query(consulta, [token]);
    return resultado.rows[0];
  }

  static async actualizarContrasena(usuarioId, nuevaContrasena) {
    const consulta = `
      UPDATE usuarios 
      SET password = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(consulta, [nuevaContrasena, usuarioId]);
  }

  static async limpiarTokenRecuperacion(usuarioId) {
    const consulta = `
      UPDATE usuarios 
      SET token_recuperacion = NULL, token_expiracion = NULL, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(consulta, [usuarioId]);
  }
}

module.exports = Usuario;