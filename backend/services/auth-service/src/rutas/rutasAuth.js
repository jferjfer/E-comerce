const express = require('express');
const ControladorAuth = require('../controladores/controladorAuth');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// Rutas de autenticación
router.post('/registro', ControladorAuth.registrar);
router.post('/register', ControladorAuth.registrar); // Alias para frontend
router.post('/login', ControladorAuth.iniciarSesion);
router.post('/logout', ControladorAuth.cerrarSesion);
router.get('/verificar', autenticar, ControladorAuth.verificarToken);

// Ruta de login simple para pruebas
router.post('/login-simple', async (req, res) => {
  const { email, password } = req.body;
  if (email === 'demo@egos.com.co' && password === 'admin123') {
    res.json({
      token: 'demo_token_' + Date.now(),
      usuario: { id: 1, email, nombre: 'Usuario Demo', rol: 'cliente' }
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Rutas de recuperación de contraseña
router.post('/solicitar-recuperacion', ControladorAuth.solicitarRecuperacion);
router.post('/recuperar-contrasena', ControladorAuth.solicitarRecuperacion); // Alias mobile
router.post('/restablecer-contrasena', ControladorAuth.restablecerContrasena);

// Refresh token — renueva el JWT si aún es válido
router.post('/refresh', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRETO;
    // Verificar sin importar si está expirado (para dar margen de 1h)
    const decoded = jwt.verify(token, secret, { ignoreExpiration: true });

    // Solo renovar si expiró hace menos de 1 hora
    const ahora = Math.floor(Date.now() / 1000);
    if (decoded.exp && ahora - decoded.exp > 3600) {
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
    }

    // Verificar que el usuario sigue activo en BD
    const pool = require('../config/baseDatos');
    const resultado = await pool.query(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = $1',
      [decoded.id]
    );
    if (!resultado.rows.length || resultado.rows[0].activo === false) {
      return res.status(401).json({ error: 'Usuario no encontrado o desactivado.' });
    }

    const usuario = resultado.rows[0];
    const nuevoToken = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, activo: true },
      secret,
      { expiresIn: '24h' }
    );

    res.json({ token: nuevoToken, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (e) {
    res.status(401).json({ error: 'Token inválido.' });
  }
});

// Derecho al olvido (Ley 1581)
router.post('/solicitar-eliminacion', autenticar, async (req, res) => {
  try {
    const { motivo } = req.body;
    const pool = require('../config/baseDatos');
    await pool.query(
      `INSERT INTO solicitud_eliminacion (usuario_id, email, motivo)
       SELECT id, email, $1 FROM usuarios WHERE id = $2`,
      [motivo || 'Solicitud del usuario', req.usuario.id]
    );
    res.json({ mensaje: 'Solicitud de eliminación registrada. Será procesada en 15 días hábiles según Ley 1581.' });
  } catch (e) {
    res.status(500).json({ error: 'Error procesando solicitud' });
  }
});

// Eliminación inmediata de cuenta (requerido por Apple App Store)
router.delete('/cuenta', autenticar, async (req, res) => {
  try {
    const pool = require('../config/baseDatos');
    const usuarioId = req.usuario.id;

    // Verificar que el usuario existe
    const check = await pool.query('SELECT id, email, rol FROM usuarios WHERE id = $1', [usuarioId]);
    if (!check.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { email, rol } = check.rows[0];

    // No permitir eliminar cuentas admin/ceo
    const rolesProtegidos = ['ceo', 'admin', 'contador', 'rrhh'];
    if (rolesProtegidos.includes(rol)) {
      return res.status(403).json({ error: 'No se puede eliminar esta cuenta desde la app' });
    }

    // Anonimizar datos personales (mantener pedidos por obligación legal DIAN)
    await pool.query(`
      UPDATE usuarios SET
        nombre = 'Cuenta',
        apellido = 'Eliminada',
        email = $1,
        password = 'CUENTA_ELIMINADA_' || id::text,
        telefono = NULL,
        direccion = NULL,
        ciudad = NULL,
        documento_tipo = NULL,
        documento_numero = NULL,
        push_token = NULL,
        activo = false,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [`eliminado_${usuarioId}@egos.deleted`, usuarioId]);

    // Eliminar favoritos y carrito
    await pool.query('DELETE FROM lista_deseos WHERE usuario_id = $1', [usuarioId]).catch(() => {});
    await pool.query('DELETE FROM carrito_producto WHERE id_carrito IN (SELECT id FROM carrito WHERE usuario_id = $1)', [usuarioId]).catch(() => {});
    await pool.query('DELETE FROM carrito WHERE usuario_id = $1', [usuarioId]).catch(() => {});

    // Registrar la eliminación
    await pool.query(
      `INSERT INTO solicitud_eliminacion (usuario_id, email, motivo) VALUES ($1, $2, $3)`,
      [usuarioId, email, 'Eliminación inmediata desde la app']
    ).catch(() => {});

    console.log(`🗑️ Cuenta eliminada: usuario ${usuarioId} (${email})`);
    res.json({ mensaje: 'Cuenta eliminada exitosamente' });
  } catch (e) {
    console.error('Error eliminando cuenta:', e.message);
    res.status(500).json({ error: 'Error eliminando la cuenta' });
  }
});

module.exports = router;