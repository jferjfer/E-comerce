const { Pool } = require('pg');

// Conexión directa a Neon PostgreSQL para producción
const configuracionBD = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zRdlv7TGEJu3@ep-red-voice-adzfb730-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  max: 20,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  query_timeout: 5000,
  statement_timeout: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
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