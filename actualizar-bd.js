const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function actualizar() {
  try {
    await pool.query(`
      ALTER TABLE devolucion 
      ADD COLUMN IF NOT EXISTS comentario_aprobacion TEXT,
      ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
      ADD COLUMN IF NOT EXISTS comentario_completado TEXT
    `);
    
    await pool.query(`
      ALTER TABLE devolucion DROP CONSTRAINT IF EXISTS devolucion_estado_check
    `);
    
    await pool.query(`
      ALTER TABLE devolucion 
      ADD CONSTRAINT devolucion_estado_check 
      CHECK (estado IN ('Solicitada', 'Aprobada', 'Rechazada', 'Completada'))
    `);
    
    console.log('✅ Tabla actualizada');
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
}

actualizar();
