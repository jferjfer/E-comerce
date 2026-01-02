const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function actualizarTablaDevolucion() {
  console.log('🔄 Actualizando tabla devolucion...');
  
  try {
    const sqlPath = path.join(__dirname, 'sql', 'actualizar_devolucion.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Tabla devolucion actualizada exitosamente');
    
    // Verificar estructura
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'devolucion'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estructura de tabla devolucion:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Error actualizando tabla:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

actualizarTablaDevolucion()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
