const ServicioAuth = require('../servicios/servicioAuth');
const SesionUsuario = require('../modelos/SesionUsuario');

const autenticar = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido' 
      });
    }

    // Verificar token JWT
    const datosToken = ServicioAuth.verificarToken(token);
    
    // Verificar que la sesión existe en BD
    const sesion = await SesionUsuario.buscarPorToken(token);
    if (!sesion) {
      return res.status(401).json({ 
        error: 'Sesión inválida o expirada' 
      });
    }

    req.usuario = {
      id: sesion.id_usuario,
      nombre: sesion.nombre,
      email: sesion.email,
      rol: sesion.rol
    };
    
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Token inválido' 
    });
  }
};

const autorizarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a este recurso' 
      });
    }
    next();
  };
};

module.exports = {
  autenticar,
  autorizarRol
};