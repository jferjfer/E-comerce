const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../modelos/Usuario');
const crypto = require('crypto');
const ServicioCorreo = require('./servicioCorreo');

class ServicioAuth {
  async registrarUsuario(datosUsuario) {
    try {
      console.log('📝 Iniciando registro de usuario:', datosUsuario.email);
      const {
        email, password, nombre, apellido,
        documento_tipo, documento_numero, telefono,
        fecha_nacimiento, genero, direccion, ciudad,
        departamento, acepta_terminos, acepta_datos, acepta_marketing
      } = datosUsuario;

      const usuarioExistente = await Usuario.buscarPorEmail(email);
      if (usuarioExistente) {
        console.log('❌ Usuario ya existe:', email);
        return { exito: false, error: 'Ya existe una cuenta con ese correo electrónico. ¿Quieres iniciar sesión?' };
      }

      const nuevoUsuario = await Usuario.crear({
        email,
        contrasena: password,
        nombre,
        apellido: apellido || null,
        rol: 'cliente',
        documento_tipo,
        documento_numero,
        telefono,
        fecha_nacimiento,
        genero,
        direccion,
        ciudad,
        departamento,
        acepta_terminos,
        acepta_datos,
        acepta_marketing
      });
      console.log('✅ Usuario creado exitosamente:', nuevoUsuario.id);

      ServicioCorreo.enviarBienvenida(email, `${nombre}${apellido ? ' ' + apellido : ''}`)
        .then(() => console.log(`📧 Correo de bienvenida enviado a ${email}`))
        .catch(err => console.log(`⚠️ No se pudo enviar bienvenida a ${email}:`, err.message));

      const token = this.generarToken(nuevoUsuario);

      return {
        exito: true,
        token,
        usuario: {
          id: nuevoUsuario.id,
          email: nuevoUsuario.email,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          rol: nuevoUsuario.rol
        }
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return { exito: false, error: 'Ocurrió un error al crear tu cuenta. Intenta de nuevo.' };
    }
  }

  async iniciarSesion(email, password) {
    try {
      // Tiempo mínimo de respuesta para mitigar timing attack
      const tiempoInicio = Date.now();
      const TIEMPO_MINIMO_MS = 1500;
      const esperarTiempoMinimo = () => {
        const elapsed = Date.now() - tiempoInicio;
        if (elapsed < TIEMPO_MINIMO_MS) {
          return new Promise(r => setTimeout(r, TIEMPO_MINIMO_MS - elapsed));
        }
        return Promise.resolve();
      };

      const usuario = await Usuario.buscarPorEmail(email);
      if (!usuario) {
        // Simular bcrypt para que el tiempo sea igual con/sin usuario
        await bcrypt.hash('timing_protection_dummy', 8);
        await esperarTiempoMinimo();
        return { exito: false, error: 'No encontramos una cuenta con ese correo. ¿Quieres registrarte?' };
      }

      if (usuario.activo === false) {
        await esperarTiempoMinimo();
        return { exito: false, error: 'Tu cuenta está desactivada. Contacta a Recursos Humanos.' };
      }

      const passwordValida = await bcrypt.compare(password, usuario.contrasena);
      await esperarTiempoMinimo();
      if (!passwordValida) {
        return { exito: false, error: 'La contraseña es incorrecta. ¿Olvidaste tu contraseña?' };
      }

      const token = this.generarToken(usuario);

      return {
        exito: true,
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol
        }
      };
    } catch (error) {
      console.error('Error en login:', error);
      return { exito: false, error: 'Error de conexión. Intenta de nuevo en unos segundos.' };
    }
  }

  async buscarUsuarioPorEmail(email) {
    return await Usuario.buscarPorEmail(email);
  }

  async guardarTokenRecuperacion(usuarioId, token, expiracion) {
    return await Usuario.guardarTokenRecuperacion(usuarioId, token, expiracion);
  }

  async restablecerContrasena(token, nuevaContrasena) {
    try {
      // Buscar usuario por token
      const usuario = await Usuario.buscarPorTokenRecuperacion(token);
      if (!usuario) {
        throw new Error('Token inválido o expirado');
      }

      // Verificar expiración
      if (new Date() > new Date(usuario.token_expiracion)) {
        throw new Error('Token expirado');
      }

      // Hashear nueva contraseña
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(nuevaContrasena, 10);

      // Actualizar contraseña
      await Usuario.actualizarContrasena(usuario.id, passwordHash);

      // Limpiar token
      await Usuario.limpiarTokenRecuperacion(usuario.id);

      return { exito: true };
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  }

  generarToken(usuario) {
    const secret = process.env.JWT_SECRETO;
    console.log('🔑 GENERANDO TOKEN CON SECRETO:', secret.substring(0, 20) + '...');

    return jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo !== false
      },
      secret,
      { expiresIn: '24h' }
    );
  }

  async verificarToken(token) {
    try {
      const secret = process.env.JWT_SECRETO;
      const decoded = jwt.verify(token, secret);
      return { valido: true, usuario: decoded };
    } catch (error) {
      return { valido: false, error: 'Token inválido' };
    }
  }
}

module.exports = new ServicioAuth();