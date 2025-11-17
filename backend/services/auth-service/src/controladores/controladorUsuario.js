const Usuario = require('../modelos/Usuario');

class ControladorUsuario {
  static async obtenerPerfil(req, res, next) {
    try {
      const usuario = await Usuario.buscarPorId(req.usuario.id);
      
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        mensaje: 'Perfil obtenido exitosamente',
        datos: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  static async actualizarTotalCompras(req, res, next) {
    try {
      const { nuevoTotal } = req.body;
      
      if (typeof nuevoTotal !== 'number' || nuevoTotal < 0) {
        return res.status(400).json({
          error: 'El total debe ser un número positivo'
        });
      }

      const resultado = await Usuario.actualizarTotalCompras(req.usuario.id, nuevoTotal);

      res.json({
        mensaje: 'Total de compras actualizado exitosamente',
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControladorUsuario;