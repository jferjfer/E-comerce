const pool = require('../src/config/baseDatos');

const crearTablas = async () => {
  try {
    console.log('🚀 Creando tablas en Vercel Postgres...');

    // Crear tabla usuario con campos de recuperación
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL CHECK (rol IN ('cliente', 'invitado', 'admin')) DEFAULT 'cliente',
        total_compras_historico DECIMAL(12, 2) DEFAULT 0.00,
        token_recuperacion VARCHAR(255),
        token_expiracion TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla sesion_usuario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sesion_usuario (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        fecha_expiracion TIMESTAMP NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usuario_token_recuperacion ON usuario(token_recuperacion)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sesion_token ON sesion_usuario(token)`);

    // Insertar usuario demo
    const bcrypt = require('bcryptjs');
    const contrasenaDemo = await bcrypt.hash('admin123', 12);
    
    await pool.query(`
      INSERT INTO usuario (nombre, email, contrasena, rol) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Usuario Demo', 'demo@estilomoda.com', contrasenaDemo, 'cliente']);

    console.log('✅ Tablas creadas exitosamente');
    console.log('👤 Usuario demo: demo@estilomoda.com / admin123');
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
  } finally {
    await pool.end();
  }
};

crearTablas();