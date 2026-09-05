/**
 * SECURITY FIX — VULN-007
 * Cambiar contraseña débil del usuario contador@egoscolombia.com
 * 
 * Ejecutar: node scripts/cambiar-contrasena-contador.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cambiarContrasena() {
  const email = 'contador@egoscolombia.com';
  // Contraseña fuerte generada por el pentest
  const nuevaContrasena = 'C1#wEVMo!jd8N4FIk$8c';

  try {
    console.log(`🔐 Cambiando contraseña para: ${email}`);

    // Verificar que el usuario existe
    const check = await pool.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE email = $1',
      [email]
    );

    if (check.rows.length === 0) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    const usuario = check.rows[0];
    console.log(`✅ Usuario encontrado: ${usuario.nombre} (${usuario.rol})`);

    // Hashear nueva contraseña con bcrypt
    const hash = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar en BD
    await pool.query(
      'UPDATE usuarios SET contrasena = $1, fecha_actualizacion = NOW() WHERE email = $2',
      [hash, email]
    );

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('⚠️  Nueva contraseña: C1#wEVMo!jd8N4FIk$8c');
    console.log('⚠️  GUARDA ESTA CONTRASEÑA EN UN LUGAR SEGURO');

    // Verificar que la contraseña vieja ya no funciona
    const checkVieja = await pool.query(
      'SELECT contrasena FROM usuarios WHERE email = $1',
      [email]
    );
    const hashGuardado = checkVieja.rows[0].contrasena;
    const viejaFunciona = await bcrypt.compare('admin123', hashGuardado);
    console.log(`\n✅ Verificación: contraseña 'admin123' ${viejaFunciona ? 'AUN FUNCIONA ❌' : 'ya NO funciona ✅'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cambiarContrasena();
