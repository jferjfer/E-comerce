const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Usar el mismo secreto que en servicioAuth
    const JWT_SECRETO = process.env.JWT_SECRETO || 'estilo_moda_jwt_secreto_produccion_2024';
    const decoded = jwt.verify(token, JWT_SECRETO);
    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { autenticar };