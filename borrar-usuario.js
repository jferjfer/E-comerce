const { Client } = require('pg');

const borrarUsuario = async () => {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('🔍 Conectando para borrar usuario Erika Arizal...');
    await client.connect();

    // Buscar el usuario
    const buscar = await client.query(`
      SELECT id, nombre, email FROM usuario 
      WHERE email LIKE '%emarizalj.marual%' 
      ORDER BY id DESC LIMIT 1
    `);

    if (buscar.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    const usuario = buscar.rows[0];
    console.log(`👤 Usuario encontrado: ${usuario.nombre} (${usuario.email}) - ID: ${usuario.id}`);

    // Borrar el usuario
    const resultado = await client.query('DELETE FROM usuario WHERE id = $1', [usuario.id]);
    
    if (resultado.rowCount > 0) {
      console.log('✅ Usuario eliminado exitosamente');
    } else {
      console.log('❌ No se pudo eliminar el usuario');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

borrarUsuario();