// Simulador de base de datos en memoria para pruebas
class BaseDatosPrueba {
  constructor() {
    this.usuarios = [];
    this.sesiones = [];
    this.contadorId = 1;
  }

  async query(consulta, parametros = []) {
    console.log('🔍 Consulta simulada:', consulta);
    console.log('📝 Parámetros:', parametros);

    // Simular INSERT usuario
    if (consulta.includes('INSERT INTO usuario')) {
      const [nombre, email, contrasena, rol] = parametros;
      const nuevoUsuario = {
        id: this.contadorId++,
        nombre,
        email,
        contrasena,
        rol,
        total_compras_historico: 0,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      };
      this.usuarios.push(nuevoUsuario);
      
      const { contrasena: _, ...usuarioSinContrasena } = nuevoUsuario;
      return { rows: [usuarioSinContrasena] };
    }

    // Simular SELECT usuario por email
    if (consulta.includes('SELECT * FROM usuario WHERE email')) {
      const [email] = parametros;
      const usuario = this.usuarios.find(u => u.email === email);
      return { rows: usuario ? [usuario] : [] };
    }

    // Simular SELECT usuario por id
    if (consulta.includes('SELECT id, nombre, email, rol')) {
      const [id] = parametros;
      const usuario = this.usuarios.find(u => u.id == id);
      if (usuario) {
        const { contrasena: _, ...usuarioSinContrasena } = usuario;
        return { rows: [usuarioSinContrasena] };
      }
      return { rows: [] };
    }

    // Simular INSERT sesión
    if (consulta.includes('INSERT INTO sesion_usuario')) {
      const [idUsuario, token, fechaExpiracion] = parametros;
      const nuevaSesion = {
        id: this.contadorId++,
        id_usuario: idUsuario,
        token,
        fecha_expiracion: fechaExpiracion,
        fecha_creacion: new Date()
      };
      this.sesiones.push(nuevaSesion);
      return { rows: [nuevaSesion] };
    }

    // Simular SELECT sesión por token
    if (consulta.includes('SELECT su.*, u.nombre, u.email, u.rol')) {
      const [token] = parametros;
      const sesion = this.sesiones.find(s => s.token === token);
      if (sesion && new Date(sesion.fecha_expiracion) > new Date()) {
        const usuario = this.usuarios.find(u => u.id === sesion.id_usuario);
        return { 
          rows: [{
            ...sesion,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
          }]
        };
      }
      return { rows: [] };
    }

    // Simular DELETE sesión
    if (consulta.includes('DELETE FROM sesion_usuario WHERE token')) {
      const [token] = parametros;
      this.sesiones = this.sesiones.filter(s => s.token !== token);
      return { rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  }

  on(evento, callback) {
    if (evento === 'connect') {
      setTimeout(() => callback(), 100);
    }
  }
}

module.exports = new BaseDatosPrueba();