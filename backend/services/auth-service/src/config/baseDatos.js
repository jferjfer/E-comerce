// Usar simulador de BD en modo prueba
if (process.env.MODO_PRUEBA === 'true') {
  console.log('🧪 Usando simulador de base de datos para pruebas');
  module.exports = require('./baseDatosPrueba');
} else {
  const { Pool } = require('pg');

  const configuracionBD = {
    host: process.env.BD_HOST || 'postgres',
    port: process.env.BD_PUERTO || 5432,
    database: process.env.BD_NOMBRE || 'ecommerce',
    user: process.env.BD_USUARIO || 'admin',
    password: process.env.BD_CONTRASENA || 'admin123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  const pool = new Pool(configuracionBD);

  pool.on('connect', () => {
    console.log('✅ Conectado a la base de datos PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('❌ Error en la conexión a la base de datos:', err);
  });

  module.exports = pool;
}