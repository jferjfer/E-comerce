const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_zRdlv7TGEJu3@ep-red-voice-adzfb730-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function crearUsuariosDevoluciones() {
  console.log('👥 Creando usuarios para sistema de devoluciones...\n');

  const usuarios = [
    {
      nombre: 'Customer Success Manager',
      email: 'customersuccess@estilomoda.com',
      contrasena: 'admin123',
      rol: 'customer_success',
      telefono: '3001234567'
    },
    {
      nombre: 'Logistics Coordinator',
      email: 'logistics@estilomoda.com',
      contrasena: 'admin123',
      rol: 'logistics_coordinator',
      telefono: '3001234568'
    }
  ];

  try {
    for (const usuario of usuarios) {
      // Verificar si ya existe
      const existe = await pool.query(
        'SELECT id FROM usuario WHERE email = $1',
        [usuario.email]
      );

      if (existe.rows.length > 0) {
        console.log(`⚠️  Usuario ${usuario.email} ya existe (ID: ${existe.rows[0].id})`);
        continue;
      }

      // Hash de contraseña
      const hashContrasena = await bcrypt.hash(usuario.contrasena, 10);

      // Insertar usuario
      const resultado = await pool.query(
        `INSERT INTO usuario (nombre, email, contrasena, rol, telefono, activo)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id, nombre, email, rol`,
        [usuario.nombre, usuario.email, hashContrasena, usuario.rol, usuario.telefono]
      );

      console.log(`✅ Usuario creado:`);
      console.log(`   Nombre: ${resultado.rows[0].nombre}`);
      console.log(`   Email: ${resultado.rows[0].email}`);
      console.log(`   Rol: ${resultado.rows[0].rol}`);
      console.log(`   ID: ${resultado.rows[0].id}\n`);
    }

    console.log('✅ Proceso completado\n');
    console.log('📋 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Customer Success:');
    console.log('  Email: customersuccess@estilomoda.com');
    console.log('  Password: admin123');
    console.log('  Rol: customer_success');
    console.log('');
    console.log('Logistics Coordinator:');
    console.log('  Email: logistics@estilomoda.com');
    console.log('  Password: admin123');
    console.log('  Rol: logistics_coordinator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

crearUsuariosDevoluciones()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
