const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function arreglarTablas() {
  try {
    console.log('🔧 Arreglando tipos de datos...');
    
    await pool.query('ALTER TABLE carrito ALTER COLUMN id_usuario TYPE integer USING id_usuario::text::integer');
    console.log('✅ Tabla carrito arreglada');
    
    await pool.query('ALTER TABLE pedido ALTER COLUMN id_usuario TYPE integer USING id_usuario::text::integer');
    console.log('✅ Tabla pedido arreglada');
    
    console.log('🎉 Tablas compatibles con integer');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

arreglarTablas();