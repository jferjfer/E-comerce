const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../modelos/Usuario');

class ServicioAuth {
  async registrarUsuario(datosUsuario) {
    try {
      const { email, password, nombre, apellido } = datosUsuario;
      
      // Verificar si el usuario ya existe
      const usuarioExistente = await Usuario.buscarPorEmail(email);
      if (usuarioExistente) {
        return { exito: false, error: 'El usuario ya existe' };
      }

      // Encriptar contraseña
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const nuevoUsuario = await Usuario.crear({
        email,
        password_hash: passwordHash,
        nombre,
        apellido,
        rol: 'cliente',
        activo: true
      });

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
      // Usuarios demo para desarrollo
      const usuariosDemo = {
        'demo@estilomoda.com': { 
          id: '1', nombre: 'Cliente Demo', rol: 'cliente', password: 'admin123' 
        },
        'admin@estilomoda.com': { 
          id: '2', nombre: 'Admin Demo', rol: 'admin', password: 'admin123' 
        },
        'vendedor@estilomoda.com': { 
          id: '3', nombre: 'Vendedor Demo', rol: 'vendedor', password: 'admin123' 
        }
      };

      const usuarioDemo = usuariosDemo[email];
      if (usuarioDemo && usuarioDemo.password === password) {
        const token = this.generarToken(usuarioDemo);
        return {
          exito: true,
          token,
          usuario: {
            id: usuarioDemo.id,
            email,
            nombre: usuarioDemo.nombre,
            rol: usuarioDemo.rol
          }
        };
      }

      // Buscar en base de datos
      const usuario = await Usuario.buscarPorEmail(email);
      if (!usuario) {
        return { exito: false, error: 'Credenciales inválidas' };
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password_hash);
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
          apellido: usuario.apellido,
          rol: usuario.rol
        }
      };
    } catch (error) {
      console.error('Error en login:', error);
      return { exito: false, error: 'Error interno del servidor' };
    }
  }

  async solicitarRecuperacion(email) {
    try {
      const usuario = await Usuario.buscarPorEmail(email);
      if (!usuario) {
        return { exito: true }; // Por seguridad, siempre responder exitosamente
      }

      // Generar token de recuperación
      const tokenRecuperacion = jwt.sign(
        { id: usuario.id, tipo: 'recuperacion' },
        'estilo_moda_jwt_secreto_produccion_2024',
        { expiresIn: '1h' }
      );

      // Aquí enviarías el email con el token
      console.log(`🔑 Token de recuperación para ${email}: ${tokenRecuperacion}`);

      return { exito: true };
    } catch (error) {
      console.error('Error en recuperación:', error);
      return { exito: false, error: 'Error interno del servidor' };
    }
  }

  async restablecerContrasena(token, nuevaContrasena) {
    try {
      // Verificar token
      const decoded = jwt.verify(token, 'estilo_moda_jwt_secreto_produccion_2024');
      if (decoded.tipo !== 'recuperacion') {
        return { exito: false, error: 'Token inválido' };
      }

      // Encriptar nueva contraseña
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(nuevaContrasena, saltRounds);

      // Actualizar contraseña
      await Usuario.actualizarContrasena(decoded.id, passwordHash);

      return { exito: true };
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      if (error.name === 'JsonWebTokenError') {
        return { exito: false, error: 'Token inválido' };
      }
      return { exito: false, error: 'Error interno del servidor' };
    }
  }

  generarToken(usuario) {
    return jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      'estilo_moda_jwt_secreto_produccion_2024',
      { expiresIn: '24h' }
    );
  }

  async verificarToken(token) {
    try {
      const decoded = jwt.verify(token, 'estilo_moda_jwt_secreto_produccion_2024');
      return { valido: true, usuario: decoded };
    } catch (error) {
      return { valido: false, error: 'Token inválido' };
    }
  }
}

module.exports = new ServicioAuth();