const ServicioAuth = require('../servicios/servicioAuth');
const ServicioCorreo = require('../servicios/servicioCorreo');
const ServicioSeguridad = require('../servicios/servicioSeguridad');
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

      // Normalizar password/contrasena
      if (value.password && !value.contrasena) {
        value.contrasena = value.password;
      }
      
      // Registrar usuario
      const resultado = await ServicioAuth.registrarUsuario(value);

      // Verificar si el registro fue exitoso
      if (!resultado.exito) {
        return res.status(400).json({
          exito: false,
          error: resultado.error || 'Error al registrar usuario'
        });
      }

      res.status(201).json({
        exito: true,
        mensaje: 'Usuario registrado exitosamente',
        usuario: resultado.usuario,
        token: resultado.token,
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  static async iniciarSesion(req, res, next) {
    try {
      const { error, value } = validarInicioSesion(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const email = value.email;

      // Verificar si la cuenta está bloqueada
      const bloqueo = await ServicioSeguridad.estaBloqueado(email);
      if (bloqueo.bloqueado) {
        return res.status(429).json({
          exito: false,
          error: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta en ${bloqueo.minutosRestantes} minuto(s).`
        });
      }

      const contrasena = value.password || value.contrasena;
      const resultado = await ServicioAuth.iniciarSesion(email, contrasena);

      if (!resultado.exito) {
        // Registrar intento fallido
        await ServicioSeguridad.registrarIntento(email, ip, false);
        const bloqueoActual = await ServicioSeguridad.estaBloqueado(email);
        const intentosRestantes = bloqueoActual.intentosRestantes || 0;
        return res.status(401).json({
          exito: false,
          error: resultado.error || 'Credenciales inválidas',
          intentos_restantes: intentosRestantes > 0 ? intentosRestantes : undefined
        });
      }

      // Login exitoso
      await ServicioSeguridad.registrarIntento(email, ip, true);
      await ServicioSeguridad.limpiarIntentos(email);
      await ServicioSeguridad.registrarAuditoria(resultado.usuario.id, 'LOGIN', 'Inicio de sesión exitoso', ip);

      res.json({
        exito: true,
        mensaje: 'Sesión iniciada exitosamente',
        usuario: resultado.usuario,
        token: resultado.token,
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
        // Revocar token en blacklist
        const jwt = require('jsonwebtoken');
        try {
          const decoded = jwt.decode(token);
          if (decoded) {
            await ServicioSeguridad.revocarToken(token, decoded.id, decoded.exp);
            await ServicioSeguridad.registrarAuditoria(decoded.id, 'LOGOUT', 'Cierre de sesión', req.ip);
          }
        } catch (e) {}
        await ServicioAuth.cerrarSesion(token);
      }

      res.json({ mensaje: 'Sesión cerrada exitosamente' });
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

      // Intentar enviar correo (no fallar si falla)
      try {
        await ServicioCorreo.enviarRecuperacionContrasena(email, tokenRecuperacion, usuario.nombre);
        console.log(`✅ Correo de recuperación enviado a ${email}`);
      } catch (errorCorreo) {
        console.log(`⚠️ No se pudo enviar correo a ${email}, pero token guardado`);
        console.log(`🔑 Token de recuperación: ${tokenRecuperacion}`);
      }

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