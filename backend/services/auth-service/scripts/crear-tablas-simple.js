const { Client } = require('pg');

const crearTablas = async () => {
  const client = new Client({
    connectionString: process.env.POSTGRES_AUTH_URL
  });

  try {
    console.log('🚀 Conectando a Neon...');
    await client.connect();
    console.log('✅ Conectado');

    // Crear tabla usuario
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
        total_compras_historico DECIMAL(12, 2) DEFAULT 0.00,
        token_recuperacion VARCHAR(255),
        token_expiracion TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla sesion_usuario
    await client.query(`
      CREATE TABLE IF NOT EXISTS sesion_usuario (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        fecha_expiracion TIMESTAMP NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices
    await client.query(`CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_usuario_token_recuperacion ON usuario(token_recuperacion)`);

    // Insertar usuario demo
    const bcrypt = require('bcryptjs');
    const contrasenaDemo = await bcrypt.hash('admin123', 12);
    
    await client.query(`
      INSERT INTO usuario (nombre, email, contrasena, rol) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Usuario Demo', 'demo@egos.com.co', contrasenaDemo, 'cliente']);

    console.log('✅ Tablas creadas exitosamente');
    console.log('👤 Usuario demo: demo@egos.com.co / admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
};

crearTablas();