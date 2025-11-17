const express = require('express');
const router = express.Router();

// Rutas simples para pruebas
router.post('/login', async (req, res) => {
  try {
    const { email, contrasena } = req.body;
    
    // Validación simple
    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Login simulado
    const usuario = {
      id: 1,
      email: email,
      nombre: 'Usuario Test'
    };

    const token = 'token_simulado_' + Date.now();

    res.json({
      mensaje: 'Login exitoso',
      token: token,
      usuario: usuario
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/registro', async (req, res) => {
  try {
    const { email, contrasena } = req.body;
    
    // Validación simple
    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Registro simulado
    const usuario = {
      id: Date.now(),
      email: email,
      nombre: 'Usuario Nuevo'
    };

    const token = 'token_simulado_' + Date.now();

    res.json({
      mensaje: 'Registro exitoso',
      token: token,
      usuario: usuario
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;