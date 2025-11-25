const { Pool } = require('pg');

// Conexión directa a Neon PostgreSQL para producción
const configuracionBD = {
  connectionString: 'postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
  max: 10,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }
};

console.log('🌍 Conectando a Neon PostgreSQL (Producción)');

const pool = new Pool(configuracionBD);

pool.on('connect', () => {
  console.log('✅ Auth Service conectado a Neon PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en Auth Service BD:', err);
});

module.exports = pool;