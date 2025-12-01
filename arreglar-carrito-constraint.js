const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function arreglar() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL Transaction\n');
    
    // Agregar constraint UNIQUE a id_usuario
    console.log('🔧 Agregando constraint UNIQUE a carrito.id_usuario...');
    await client.query('ALTER TABLE carrito ADD CONSTRAINT carrito_id_usuario_key UNIQUE (id_usuario)');
    console.log('✅ Constraint agregado exitosamente\n');
    
    // Verificar
    const result = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'carrito' AND constraint_type = 'UNIQUE'
    `);
    
    console.log('📋 Constraints UNIQUE en carrito:');
    result.rows.forEach(row => {
      console.log(`   • ${row.constraint_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

arreglar();
