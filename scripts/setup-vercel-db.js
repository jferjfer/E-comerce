const { Pool } = require('pg');
require('dotenv').config();

async function configurarBaseDatosVercel() {
  console.log('🚀 Configurando base de datos en Vercel...');
  
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Conectado a Vercel Postgres');

    const crearTablas = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
        token_recuperacion VARCHAR(255),
        token_expiracion TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS productos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        categoria VARCHAR(100),
        imagen VARCHAR(500),
        en_stock BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    `;

    await client.query(crearTablas);
    console.log('✅ Tablas creadas exitosamente');

    client.release();
    console.log('🎉 Base de datos configurada correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

configurarBaseDatosVercel();