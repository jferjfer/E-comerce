const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function crearTablaHistorial() {
  try {
    console.log('📋 Creando tabla pedido_historial...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedido_historial (
        id SERIAL PRIMARY KEY,
        id_pedido UUID NOT NULL,
        estado_anterior VARCHAR(50),
        estado_nuevo VARCHAR(50) NOT NULL,
        comentario TEXT,
        fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tabla pedido_historial creada');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pedido_historial_pedido ON pedido_historial(id_pedido);
    `);

    console.log('✅ Índice creado');

    await pool.end();
    console.log('✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearTablaHistorial();
