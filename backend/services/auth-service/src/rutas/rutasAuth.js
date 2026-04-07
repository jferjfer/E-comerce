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
router.post('/restablecer-contrasena', ControladorAuth.restablecerContrasena);

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

module.exports = router;