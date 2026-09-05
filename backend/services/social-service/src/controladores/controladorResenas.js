const ServicioResenas = require('../servicios/servicioResenas');
const { validarResena } = require('../utils/validaciones');

class ControladorResenas {
  static async crearResena(req, res, next) {
    try {
      const { error, value } = validarResena(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const servicio = new ServicioResenas();
      const resena = await servicio.crearResena({
        ...value,
        id_usuario: req.usuario.id
      });

      res.status(201).json({
        mensaje: 'Reseña creada exitosamente',
        datos: resena
      });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerResenasPorProducto(req, res, next) {
    try {
      const { idProducto } = req.params;
      const limite = parseInt(req.query.limite) || 10;
      const pagina = parseInt(req.query.pagina) || 1;

      const servicio = new ServicioResenas();
      const resultado = await servicio.obtenerResenasPorProducto(idProducto, limite, pagina);

      res.json({
        mensaje: 'Reseñas obtenidas exitosamente',
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerResenasPorUsuario(req, res, next) {
    try {
      const limite = parseInt(req.query.limite) || 10;
      const pagina = parseInt(req.query.pagina) || 1;

      const servicio = new ServicioResenas();
      const resultado = await servicio.obtenerResenasPorUsuario(req.usuario.id, limite, pagina);

      res.json({
        mensaje: 'Reseñas del usuario obtenidas exitosamente',
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  static async marcarUtilidad(req, res, next) {
    try {
      const { idResena } = req.params;
      const { util } = req.body;

      const servicio = new ServicioResenas();
      const resena = await servicio.marcarUtilidad(idResena, util ? 1 : -1);

      res.json({
        mensaje: 'Utilidad marcada exitosamente',
        datos: resena
      });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerEstadisticasProducto(req, res, next) {
    try {
      const { idProducto } = req.params;

      const servicio = new ServicioResenas();
      const estadisticas = await servicio.obtenerEstadisticasProducto(idProducto);

      res.json({
        mensaje: 'Estadísticas obtenidas exitosamente',
        datos: estadisticas
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControladorResenas;