const ServicioCarrito = require('../servicios/servicioCarrito');
const { validarAgregarProducto, validarActualizarCantidad } = require('../utils/validaciones');

class ControladorCarrito {
  static async obtenerCarrito(req, res, next) {
    try {
      const resultado = await ServicioCarrito.obtenerCarrito(req.usuario.id);
      
      res.json({
        mensaje: 'Carrito obtenido exitosamente',
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  static async agregarProducto(req, res, next) {
    try {
      const { error, value } = validarAgregarProducto(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const resultado = await ServicioCarrito.agregarProducto(
        req.usuario.id,
        value.id_producto,
        value.cantidad
      );

      res.status(201).json({
        mensaje: resultado.mensaje,
        datos: resultado.producto
      });
    } catch (error) {
      next(error);
    }
  }

  static async actualizarCantidad(req, res, next) {
    try {
      const { id_producto } = req.params;
      const { error, value } = validarActualizarCantidad(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const resultado = await ServicioCarrito.actualizarCantidad(
        req.usuario.id,
        id_producto,
        value.cantidad
      );

      res.json({
        mensaje: resultado.mensaje,
        datos: resultado.producto
      });
    } catch (error) {
      next(error);
    }
  }

  static async eliminarProducto(req, res, next) {
    try {
      const { id_producto } = req.params;
      
      const resultado = await ServicioCarrito.eliminarProducto(
        req.usuario.id,
        id_producto
      );

      res.json({
        mensaje: resultado.mensaje
      });
    } catch (error) {
      next(error);
    }
  }

  static async vaciarCarrito(req, res, next) {
    try {
      const resultado = await ServicioCarrito.vaciarCarrito(req.usuario.id);

      res.json({
        mensaje: resultado.mensaje,
        productos_eliminados: resultado.productos_eliminados
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControladorCarrito;