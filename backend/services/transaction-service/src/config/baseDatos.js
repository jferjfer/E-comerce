const { Pool } = require('pg');

// Configuración PostgreSQL Neon
const configuracionBD = {
  connectionString: 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  max: 10,
  connectionTimeoutMillis: 20000,
  ssl: { rejectUnauthorized: false }
};

console.log('🌍 Conectando Transaction Service a Neon PostgreSQL');

const pool = new Pool(configuracionBD);

pool.on('connect', () => {
  console.log('✅ Transaction Service conectado a Neon PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en Transaction Service BD:', err);
});

module.exports = pool;