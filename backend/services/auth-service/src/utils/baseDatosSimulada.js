// Base de datos simulada en memoria para desarrollo
const usuarios = [
  {
    id: 1,
    nombre: 'Usuario Demo',
    email: 'demo@estilomoda.com',
    contrasena: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // admin123
    rol: 'cliente',
    total_compras_historico: 0,
    token_recuperacion: null,
    token_expiracion: null,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  }
];

const sesiones = [];

class BaseDatosSimulada {
  static async query(consulta, parametros = []) {
    console.log('🔍 Consulta simulada:', consulta);
    
    // Simular INSERT usuario
    if (consulta.includes('INSERT INTO usuario')) {
      const nuevoUsuario = {
        id: usuarios.length + 1,
        nombre: parametros[0],
        email: parametros[1],
        contrasena: parametros[2],
        rol: parametros[3] || 'cliente',
        total_compras_historico: 0,
        token_recuperacion: null,
        token_expiracion: null,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      };
      usuarios.push(nuevoUsuario);
      return { rows: [nuevoUsuario] };
    }
    
    // Simular SELECT por email
    if (consulta.includes('SELECT * FROM usuario WHERE email')) {
      const usuario = usuarios.find(u => u.email === parametros[0]);
      return { rows: usuario ? [usuario] : [] };
    }
    
    // Simular UPDATE token recuperación
    if (consulta.includes('UPDATE usuario') && consulta.includes('token_recuperacion')) {
      const usuario = usuarios.find(u => u.id === parametros[2]);
      if (usuario) {
        usuario.token_recuperacion = parametros[0];
        usuario.token_expiracion = parametros[1];
        usuario.fecha_actualizacion = new Date();
      }
      return { rows: [] };
    }
    
    // Simular SELECT por token
    if (consulta.includes('WHERE token_recuperacion')) {
      const usuario = usuarios.find(u => u.token_recuperacion === parametros[0]);
      return { rows: usuario ? [usuario] : [] };
    }
    
    // Simular UPDATE contraseña
    if (consulta.includes('UPDATE usuario') && consulta.includes('contrasena')) {
      const usuario = usuarios.find(u => u.id === parametros[1]);
      if (usuario) {
        usuario.contrasena = parametros[0];
        usuario.fecha_actualizacion = new Date();
      }
      return { rows: [] };
    }
    
    // Simular limpiar token
    if (consulta.includes('token_recuperacion = NULL')) {
      const usuario = usuarios.find(u => u.id === parametros[0]);
      if (usuario) {
        usuario.token_recuperacion = null;
        usuario.token_expiracion = null;
        usuario.fecha_actualizacion = new Date();
      }
      return { rows: [] };
    }
    
    return { rows: [] };
  }
}

module.exports = BaseDatosSimulada;