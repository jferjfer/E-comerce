const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../modelos/Usuario');
const SesionUsuario = require('../modelos/SesionUsuario');

class ServicioAuth {
  static generarToken(datosUsuario) {
    return jwt.sign(
      { 
        id: datosUsuario.id,
        email: datosUsuario.email,
        rol: datosUsuario.rol
      },
      process.env.JWT_SECRETO,
      { expiresIn: process.env.JWT_EXPIRACION || '24h' }
    );
  }

  static async registrarUsuario(datosUsuario) {
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.buscarPorEmail(datosUsuario.email);
    if (usuarioExistente) {
      throw new Error('El usuario ya existe con este email');
    }

    // Crear nuevo usuario
    const nuevoUsuario = await Usuario.crear(datosUsuario);
    
    // Generar token
    const token = this.generarToken(nuevoUsuario);
    
    // Crear sesión
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);
    
    await SesionUsuario.crear(nuevoUsuario.id, token, fechaExpiracion);

    return {
      usuario: nuevoUsuario,
      token
    };
  }

  static async iniciarSesion(email, contrasena) {
    // Buscar usuario
    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const contrasenaValida = await Usuario.verificarContrasena(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token
    const token = this.generarToken(usuario);
    
    // Crear sesión
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);
    
    await SesionUsuario.crear(usuario.id, token, fechaExpiracion);

    // Remover contraseña de la respuesta
    const { contrasena: _, ...usuarioSinContrasena } = usuario;

    return {
      usuario: usuarioSinContrasena,
      token
    };
  }

  static async cerrarSesion(token) {
    await SesionUsuario.eliminarPorToken(token);
  }

  static verificarToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRETO);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  static async buscarUsuarioPorEmail(email) {
    return await Usuario.buscarPorEmail(email);
  }

  static async guardarTokenRecuperacion(usuarioId, token, expiracion) {
    return await Usuario.guardarTokenRecuperacion(usuarioId, token, expiracion);
  }

  static async restablecerContrasena(token, nuevaContrasena) {
    // Buscar usuario por token de recuperación
    const usuario = await Usuario.buscarPorTokenRecuperacion(token);
    if (!usuario) {
      throw new Error('Token inválido o expirado');
    }

    // Verificar que el token no haya expirado
    if (new Date() > usuario.token_expiracion) {
      throw new Error('Token expirado');
    }

    // Encriptar nueva contraseña
    const contrasenaEncriptada = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contraseña y limpiar token
    await Usuario.actualizarContrasena(usuario.id, contrasenaEncriptada);
    await Usuario.limpiarTokenRecuperacion(usuario.id);

    return true;
  }
}

module.exports = ServicioAuth;