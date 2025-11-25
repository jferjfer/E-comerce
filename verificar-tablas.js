const { Client } = require('pg');

const verificarTablas = async () => {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('🔍 Conectando a Neon para verificar tablas...');
    await client.connect();
    console.log('✅ Conectado\n');

    // Verificar tablas existentes
    const tablas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Tablas encontradas:');
    tablas.rows.forEach(tabla => {
      console.log(`   • ${tabla.table_name}`);
    });

    // Verificar estructura de tabla usuario
    if (tablas.rows.some(t => t.table_name === 'usuario')) {
      console.log('\n🔍 Estructura de tabla usuario:');
      const columnas = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'usuario'
        ORDER BY ordinal_position
      `);
      
      columnas.rows.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });

      // Contar usuarios
      const usuarios = await client.query('SELECT COUNT(*) as total FROM usuario');
      console.log(`\n👥 Total usuarios: ${usuarios.rows[0].total}`);

      // Mostrar usuarios demo
      const usuariosDemo = await client.query('SELECT id, nombre, email, rol FROM usuario LIMIT 5');
      if (usuariosDemo.rows.length > 0) {
        console.log('\n👤 Usuarios en BD:');
        usuariosDemo.rows.forEach(user => {
          console.log(`   • ${user.nombre} (${user.email}) - ${user.rol}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

verificarTablas();