const { Pool } = require('pg');

// Configuración PostgreSQL Neon
const configuracionBD = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  query_timeout: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: { rejectUnauthorized: false }
};

console.log('🌍 Conectando Marketing Service a Neon PostgreSQL');

const pool = new Pool(configuracionBD);

pool.on('connect', () => {
  console.log('✅ Marketing Service conectado a Neon PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en Marketing Service BD:', err);
});

module.exports = pool;