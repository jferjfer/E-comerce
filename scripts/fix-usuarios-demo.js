const pool = require('../src/config/baseDatos');
const bcrypt = require('bcryptjs');

async function fix() {
  const hash = await bcrypt.hash('admin123', 8);
  const usuarios = [
    ['demo@egoscolombia.com', 'cliente', 'Demo', 'Cliente'],
    ['ceo@egoscolombia.com', 'ceo', 'Jose Fernando', 'Vertel'],
    ['admin@egoscolombia.com', 'ceo', 'Admin', 'EGOS'],
  ];
  for (const [email, rol, nombre, apellido] of usuarios) {
    await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, rol, acepta_terminos, acepta_datos)
       VALUES ($1,$2,$3,$4,$5,true,true)
       ON CONFLICT (email) DO UPDATE SET password=$4, rol=$5`,
      [nombre, apellido, email, hash, rol]
    );
    console.log('✅', email, rol);
  }
  process.exit(0);
}
fix().catch(e => { console.error(e.message); process.exit(1); });
