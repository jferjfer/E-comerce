const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../modelos/Usuario');
const crypto = require('crypto');
const ServicioCorreo = require('./servicioCorreo');

class ServicioAuth {
  async registrarUsuario(datosUsuario) {
    try {
      console.log('📝 Iniciando registro de usuario:', datosUsuario.email);
      const { email, password, nombre, apellido } = datosUsuario;

      // Verificar si el usuario ya existe
      console.log('🔍 Verificando si el usuario existe:', email);
      const usuarioExistente = await Usuario.buscarPorEmail(email);
      if (usuarioExistente) {
        console.log('❌ Usuario ya existe:', email);
        return { exito: false, error: 'El usuario ya existe' };
      }
      console.log('✅ Usuario no existe, procediendo con registro');

      // Crear usuario (el modelo ya hashea la contraseña)
      console.log('📝 Creando usuario en base de datos...');
      const nuevoUsuario = await Usuario.crear({
        email,
        contrasena: password,
        nombre: nombre + (apellido ? ` ${apellido}` : ''),
        rol: 'cliente'
      });
      console.log('✅ Usuario creado exitosamente:', nuevoUsuario.id);

      // Enviar correo de bienvenida (sin bloquear el registro)
      ServicioCorreo.enviarBienvenida(email, nuevoUsuario.nombre)
        .then(() => console.log(`📧 Correo de bienvenida enviado a ${email}`))
        .catch(err => console.log(`⚠️ No se pudo enviar bienvenida a ${email}:`, err.message));

      // Generar token
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
      return { exito: false, error: 'Error interno del servidor' };
    }
  }

  async iniciarSesion(email, password) {
    try {
      // Buscar en base de datos
      const usuario = await Usuario.buscarPorEmail(email);
      if (!usuario) {
        return { exito: false, error: 'Credenciales inválidas' };
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.contrasena);
      if (!passwordValida) {
        return { exito: false, error: 'Credenciales inválidas' };
      }

      // Generar token
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
      return { exito: false, error: 'Error interno del servidor' };
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
    const secret = process.env.JWT_SECRETO || 'estilo_moda_jwt_secreto_produccion_2024_seguro_v2';
    console.log('🔑 GENERANDO TOKEN CON SECRETO:', secret.substring(0, 20) + '...');

    return jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      },
      secret,
      { expiresIn: '24h' }
    );
  }

  async verificarToken(token) {
    try {
      const secret = process.env.JWT_SECRETO || 'estilo_moda_jwt_secreto_produccion_2024_seguro_v2';
      const decoded = jwt.verify(token, secret);
      return { valido: true, usuario: decoded };
    } catch (error) {
      return { valido: false, error: 'Token inválido' };
    }
  }
}

module.exports = new ServicioAuth();