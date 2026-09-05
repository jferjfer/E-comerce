const crypto = require('crypto');
const pool = require('../config/baseDatos');

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

// ============================================
// BLACKLIST DE TOKENS
// ============================================
const revocarToken = async (token, usuarioId, expiracion) => {
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(
      `INSERT INTO token_blacklist (token_hash, usuario_id, fecha_expiracion)
       VALUES ($1, $2, $3) ON CONFLICT (token_hash) DO NOTHING`,
      [hash, usuarioId, new Date(expiracion * 1000)]
    );
    // Limpiar tokens expirados
    await pool.query('DELETE FROM token_blacklist WHERE fecha_expiracion < NOW()');
  } catch (e) {
    console.error('Error revocando token:', e.message);
  }
};

const estaRevocado = async (token) => {
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const res = await pool.query(
      'SELECT id FROM token_blacklist WHERE token_hash = $1 AND fecha_expiracion > NOW()',
      [hash]
    );
    return res.rows.length > 0;
  } catch (e) {
    return false;
  }
};

// ============================================
// BLOQUEO DE CUENTA POR INTENTOS FALLIDOS
// ============================================
const registrarIntento = async (email, ip, exitoso) => {
  try {
    await pool.query(
      'INSERT INTO intentos_login (email, ip_address, exitoso) VALUES ($1, $2, $3)',
      [email, ip || 'unknown', exitoso]
    );
  } catch (e) {
    console.error('Error registrando intento:', e.message);
  }
};

const estaBloqueado = async (email) => {
  try {
    const desde = new Date(Date.now() - BLOQUEO_MINUTOS * 60 * 1000);
    const res = await pool.query(
      `SELECT COUNT(*) as intentos FROM intentos_login
       WHERE email = $1 AND exitoso = false AND fecha > $2`,
      [email, desde]
    );
    const intentos = parseInt(res.rows[0].intentos);
    if (intentos >= MAX_INTENTOS) {
      // Calcular tiempo restante
      const primerIntento = await pool.query(
        `SELECT fecha FROM intentos_login
         WHERE email = $1 AND exitoso = false AND fecha > $2
         ORDER BY fecha ASC LIMIT 1`,
        [email, desde]
      );
      if (primerIntento.rows.length > 0) {
        const desbloqueo = new Date(primerIntento.rows[0].fecha.getTime() + BLOQUEO_MINUTOS * 60 * 1000);
        const minutosRestantes = Math.ceil((desbloqueo - new Date()) / 60000);
        return { bloqueado: true, minutosRestantes: Math.max(1, minutosRestantes) };
      }
    }
    return { bloqueado: false, intentosRestantes: MAX_INTENTOS - intentos };
  } catch (e) {
    return { bloqueado: false };
  }
};

const limpiarIntentos = async (email) => {
  try {
    await pool.query('DELETE FROM intentos_login WHERE email = $1', [email]);
  } catch (e) {}
};

// ============================================
// LOG DE AUDITORÍA
// ============================================
const registrarAuditoria = async (usuarioId, accion, detalle, ip) => {
  try {
    await pool.query(
      `INSERT INTO log_auditoria (id_usuario, accion, entidad_afectada)
       VALUES ($1, $2, $3)`,
      [usuarioId, accion, `${detalle} | IP: ${ip || 'unknown'}`]
    );
  } catch (e) {}
};

module.exports = {
  revocarToken,
  estaRevocado,
  registrarIntento,
  estaBloqueado,
  limpiarIntentos,
  registrarAuditoria,
  MAX_INTENTOS,
  BLOQUEO_MINUTOS
};
