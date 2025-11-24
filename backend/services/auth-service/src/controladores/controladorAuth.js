const ServicioAuth = require('../servicios/servicioAuth');
const ServicioCorreo = require('../servicios/servicioCorreo');
const { validarRegistro, validarInicioSesion, sanitizarEntrada } = require('../utils/validaciones');
const crypto = require('crypto');

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

  static async solicitarRecuperacion(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email es requerido' });
      }

      // Verificar si el usuario existe
      const usuario = await ServicioAuth.buscarUsuarioPorEmail(email);
      if (!usuario) {
        // Por seguridad, siempre responder exitosamente
        return res.json({ mensaje: 'Si el email existe, recibirás un enlace de recuperación' });
      }

      // Generar token de recuperación
      const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
      const expiracion = new Date(Date.now() + 3600000); // 1 hora

      // Guardar token en base de datos
      await ServicioAuth.guardarTokenRecuperacion(usuario.id, tokenRecuperacion, expiracion);

      // Enviar correo
      await ServicioCorreo.enviarRecuperacionContrasena(email, tokenRecuperacion, usuario.nombre);

      res.json({ mensaje: 'Si el email existe, recibirás un enlace de recuperación' });
    } catch (error) {
      next(error);
    }
  }

  static async restablecerContrasena(req, res, next) {
    try {
      const { token, nuevaContrasena } = req.body;
      
      if (!token || !nuevaContrasena) {
        return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
      }

      if (nuevaContrasena.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Verificar y usar token
      const resultado = await ServicioAuth.restablecerContrasena(token, nuevaContrasena);
      
      res.json({ mensaje: 'Contraseña restablecida exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControladorAuth;