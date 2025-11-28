const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function verificarTablas() {
  try {
    console.log('🔍 Verificando tablas...');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Tablas encontradas:');
    result.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    // Verificar estructura de carrito
    const carritoInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'carrito'
    `);
    
    console.log('\n🛒 Estructura tabla carrito:');
    carritoInfo.rows.forEach(row => {
      console.log(`   • ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTablas();