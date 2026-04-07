const jwt = require('jsonwebtoken');
const { estaRevocado } = require('../servicios/servicioSeguridad');

const autenticar = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const JWT_SECRETO = process.env.JWT_SECRETO;
    if (!JWT_SECRETO) {
      console.error('❌ JWT_SECRETO no configurado');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const decoded = jwt.verify(token, JWT_SECRETO);

    // Verificar si el token fue revocado (logout)
    const revocado = await estaRevocado(token);
    if (revocado) {
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
    }

    // Verificar que el usuario esté activo
    if (decoded.activo === false) {
      return res.status(401).json({ error: 'Usuario desactivado. Contacta a Recursos Humanos.' });
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    console.error('Error verificando token:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { autenticar };
