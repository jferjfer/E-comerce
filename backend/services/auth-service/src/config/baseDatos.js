const { Pool } = require('pg');

// Configuración adaptativa: Vercel o Neon
const configuracionBD = {
  connectionString: process.env.POSTGRES_URL || 'postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
  max: 10,
  connectionTimeoutMillis: 20000,
};
console.log('🌍 Conectando a:', process.env.POSTGRES_URL ? 'Vercel Postgres' : 'Neon Postgres');

const pool = new Pool(configuracionBD);

pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos');
});

pool.on('error', (err) => {
  console.error('❌ Error en base de datos:', err);
});

module.exports = pool;