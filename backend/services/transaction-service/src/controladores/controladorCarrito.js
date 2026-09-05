const ServicioCarrito = require('../servicios/servicioCarrito');
const { validarAgregarProducto, validarActualizarCantidad } = require('../utils/validaciones');

// Middleware para validar que solo clientes puedan usar el carrito
const validarRolCliente = (req, res, next) => {
  if (req.usuario.rol !== 'cliente') {
    return res.status(403).json({
      error: 'Acceso denegado',
      mensaje: 'Solo los clientes pueden realizar compras'
    });
  }
  next();
};

class ControladorCarrito {
  static validarRolCliente = validarRolCliente;
  
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
      // Validar rol de cliente
      if (req.usuario.rol !== 'cliente') {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: 'Solo los clientes pueden agregar productos al carrito'
        });
      }
      
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
      // Validar rol de cliente
      if (req.usuario.rol !== 'cliente') {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: 'Solo los clientes pueden modificar el carrito'
        });
      }
      
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
      // Validar rol de cliente
      if (req.usuario.rol !== 'cliente') {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: 'Solo los clientes pueden eliminar productos del carrito'
        });
      }
      
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
      // Validar rol de cliente
      if (req.usuario.rol !== 'cliente') {
        return res.status(403).json({
          error: 'Acceso denegado',
          mensaje: 'Solo los clientes pueden vaciar el carrito'
        });
      }
      
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