const { Pool } = require('pg');

// Configuración para Vercel Postgres
const configuracionVercel = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  connectionTimeoutMillis: 20000,
};

// Fallback para desarrollo local
const configuracionLocal = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bd_autenticacion',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 10,
  connectionTimeoutMillis: 20000,
};

// Usar Vercel si está disponible, sino local
const configuracion = process.env.POSTGRES_URL ? configuracionVercel : configuracionLocal;

console.log('🔗 Conectando a:', process.env.POSTGRES_URL ? 'Vercel Postgres' : 'Base de datos local');

const pool = new Pool(configuracion);

pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos');
});

pool.on('error', (err) => {
  console.error('❌ Error en base de datos:', err);
});

// Función para probar conexión
async function probarConexion() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', result.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return false;
  }
}

module.exports = { pool, probarConexion };