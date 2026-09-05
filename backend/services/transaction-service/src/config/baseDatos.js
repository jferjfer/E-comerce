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

console.log('🌍 Conectando Transaction Service a:', configuracionBD.connectionString.substring(0, 50) + '...');

const pool = new Pool(configuracionBD);

pool.on('connect', () => {
  console.log('✅ Transaction Service conectado a Neon PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en Transaction Service BD:', err);
});

module.exports = pool;