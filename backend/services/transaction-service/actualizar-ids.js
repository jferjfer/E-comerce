const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function actualizarBaseDatos() {
  console.log('🔄 Actualizando estructura de base de datos...\n');
  
  try {
    // Leer archivo SQL
    const sqlPath = path.join(__dirname, 'sql', 'actualizar-ids-personalizados.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar cada comando SQL
    const comandos = sql.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
    
    for (const comando of comandos) {
      if (comando.trim()) {
        console.log('📝 Ejecutando:', comando.substring(0, 50) + '...');
        await pool.query(comando);
        console.log('✅ Completado\n');
      }
    }
    
    console.log('✅ Base de datos actualizada exitosamente');
    console.log('\n📋 NUEVOS FORMATOS DE ID:');
    console.log('   • Pedidos:  EM25010200001');
    console.log('   • Carritos: CA25010200001');
    console.log('   • Pagos:    PG25010200001');
    console.log('\n⚠️  NOTA: Los pedidos existentes mantienen su UUID original');
    
  } catch (error) {
    console.error('❌ Error actualizando base de datos:', error.message);
    console.error('\n⚠️  Si la base de datos ya tiene datos, este error es esperado.');
    console.error('   Los nuevos pedidos usarán el formato personalizado automáticamente.');
  } finally {
    await pool.end();
  }
}

actualizarBaseDatos();
