const ServicioAuth = require('../servicios/servicioAuth');
const { validarRegistro, validarInicioSesion, sanitizarEntrada } = require('../utils/validaciones');

class ControladorAuth {
  static async registrar(req, res, next) {
    try {
      // Validar datos de entrada
      const { error, value } = validarRegistro(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      // Registrar usuario
      const resultado = await ServicioAuth.registrarUsuario(value);

      res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  static async iniciarSesion(req, res, next) {
    try {
      // Validar datos de entrada
      const { error, value } = validarInicioSesion(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      // Iniciar sesión
      const resultado = await ServicioAuth.iniciarSesion(value.email, value.contrasena);

      res.json({
        mensaje: 'Sesión iniciada exitosamente',
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  static async cerrarSesion(req, res, next) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (token) {
        await ServicioAuth.cerrarSesion(token);
      }

      res.json({
        mensaje: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  static async verificarToken(req, res) {
    res.json({
      mensaje: 'Token válido',
      usuario: req.usuario
    });
  }
}

module.exports = ControladorAuth;