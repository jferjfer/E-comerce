const axios = require('axios');

const autenticar = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido' 
      });
    }

    // Verificar token con el servicio de autenticación
    const urlAuth = process.env.SERVICIO_AUTH_URL || 'http://localhost:3001';
    
    try {
      const respuesta = await axios.get(`${urlAuth}/api/auth/verificar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      req.usuario = respuesta.data.usuario;
      next();
    } catch (error) {
      if (error.response?.status === 401) {
        return res.status(401).json({ 
          error: 'Token inválido o expirado' 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

module.exports = {
  autenticar
};