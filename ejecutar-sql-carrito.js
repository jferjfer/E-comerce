const { Pool } = require('pg');
const fs = require('fs');

// Configuración de conexión a Neon
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function ejecutarSQL() {
  try {
    console.log('🔗 Conectando a Neon PostgreSQL...');
    
    // Leer el archivo SQL
    const sqlScript = fs.readFileSync('./crear-tablas-carrito.sql', 'utf8');
    
    console.log('📋 Ejecutando script SQL...');
    
    // Ejecutar el script
    await pool.query(sqlScript);
    
    console.log('✅ Tablas del carrito creadas exitosamente');
    
    // Verificar que las tablas se crearon
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('carrito', 'carrito_producto', 'pedido')
    `);
    
    console.log('📊 Tablas creadas:', result.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error.message);
  } finally {
    await pool.end();
    console.log('🔚 Conexión cerrada');
  }
}

ejecutarSQL();