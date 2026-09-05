const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Configuración PostgreSQL (usando la misma del auth-service)
const pgConfig = {
  connectionString: process.env.POSTGRES_AUTH_URL,
  ssl: { rejectUnauthorized: false }
};

// Configuración MongoDB (usando la misma del catalog-service)
const mongoUri = process.env.MONGODB_CATALOG_URI;

// Usuarios PostgreSQL (Auth, Transaction, Credit, Logistics, Marketing)
const usuariosPostgreSQL = [
  { email: 'ceo@estilomoda.com', nombre: 'CEO Principal', rol: 'ceo' },
  { email: 'cfo@estilomoda.com', nombre: 'CFO Principal', rol: 'cfo' },
  { email: 'cmo@estilomoda.com', nombre: 'CMO Principal', rol: 'cmo' },
  { email: 'director.operaciones@estilomoda.com', nombre: 'Director Operaciones', rol: 'director_operaciones' },
  { email: 'gerente.marketing@estilomoda.com', nombre: 'Gerente Marketing', rol: 'gerente_marketing' },
  { email: 'gerente.ventas@estilomoda.com', nombre: 'Gerente Ventas', rol: 'gerente_ventas' },
  { email: 'gerente.logistica@estilomoda.com', nombre: 'Gerente Logística', rol: 'gerente_logistica' },
  { email: 'analista.datos@estilomoda.com', nombre: 'Analista Datos', rol: 'analista_datos' },
  { email: 'coordinador.inventario@estilomoda.com', nombre: 'Coordinador Inventario', rol: 'coordinador_inventario' },
  { email: 'soporte.cliente@estilomoda.com', nombre: 'Soporte Cliente', rol: 'soporte_cliente' },
  { email: 'cliente1@estilomoda.com', nombre: 'María García', rol: 'cliente' },
  { email: 'cliente2@estilomoda.com', nombre: 'Juan Pérez', rol: 'cliente' },
  { email: 'cliente3@estilomoda.com', nombre: 'Ana López', rol: 'cliente' },
  { email: 'demo@estilomoda.com', nombre: 'Usuario Demo', rol: 'cliente' },
  { email: 'invitado@estilomoda.com', nombre: 'Usuario Invitado', rol: 'invitado' }
];

// Usuarios MongoDB (Catalog, Social, AI)
const usuariosMongoDB = [
  { email: 'director.tecnologia@estilomoda.com', nombre: 'Director Tecnología', rol: 'director_tecnologia' },
  { email: 'director.recursos@estilomoda.com', nombre: 'Director RRHH', rol: 'director_recursos_humanos' },
  { email: 'gerente.regional@estilomoda.com', nombre: 'Gerente Regional', rol: 'gerente_regional' },
  { email: 'gerente.categoria@estilomoda.com', nombre: 'Gerente Categoría', rol: 'gerente_categoria' },
  { email: 'gerente.producto@estilomoda.com', nombre: 'Gerente Producto', rol: 'gerente_producto' },
  { email: 'seller.premium@estilomoda.com', nombre: 'Seller Premium', rol: 'seller_premium' },
  { email: 'seller.gold@estilomoda.com', nombre: 'Seller Gold', rol: 'seller_gold' },
  { email: 'seller.basico@estilomoda.com', nombre: 'Seller Básico', rol: 'seller_basico' }
];

async function crearUsuariosPostgreSQL() {
  const client = new Pool(pgConfig);
  
  try {
    console.log('🔗 Conectando a PostgreSQL...');
    
    // Crear tabla si no existe (usando estructura del auth-service)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        rol VARCHAR(100) NOT NULL,
        total_compras_historico DECIMAL(12, 2) DEFAULT 0.00,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📝 Creando usuarios en PostgreSQL...');
    
    for (const usuario of usuariosPostgreSQL) {
      const contrasenaHash = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO usuario (email, nombre, contrasena, rol) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (email) DO UPDATE SET 
        nombre = $2, contrasena = $3, rol = $4
      `, [usuario.email, usuario.nombre, contrasenaHash, usuario.rol]);
      
      console.log(`✅ Usuario ${usuario.rol}: ${usuario.email}`);
    }
    
    console.log('✅ Usuarios PostgreSQL creados exitosamente');
  } catch (error) {
    console.error('❌ Error PostgreSQL:', error.message);
  } finally {
    await client.end();
  }
}

async function crearUsuariosMongoDB() {
  let client;
  
  try {
    console.log('🔗 Conectando a MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db('catalogo_db');
    const collection = db.collection('usuarios');
    
    console.log('📝 Creando usuarios en MongoDB...');
    
    for (const usuario of usuariosMongoDB) {
      const contrasenaHash = await bcrypt.hash('admin123', 10);
      
      await collection.updateOne(
        { email: usuario.email },
        {
          $set: {
            email: usuario.email,
            nombre: usuario.nombre,
            contrasena: contrasenaHash,
            rol: usuario.rol,
            activo: true,
            fechaCreacion: new Date(),
            perfil: {
              preferencias: [],
              historialCompras: [],
              puntosFidelidad: usuario.rol.includes('cliente') ? 100 : 0
            }
          }
        },
        { upsert: true }
      );
      
      console.log(`✅ Usuario ${usuario.rol}: ${usuario.email}`);
    }
    
    console.log('✅ Usuarios MongoDB creados exitosamente');
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
  } finally {
    if (client) await client.close();
  }
}

async function main() {
  console.log('🚀 Iniciando creación de usuarios por base de datos específica...\n');
  
  await crearUsuariosPostgreSQL();
  console.log('');
  await crearUsuariosMongoDB();
  
  console.log('\n🎉 Proceso completado.');
  console.log(`📊 PostgreSQL: ${usuariosPostgreSQL.length} usuarios (Auth, Transaction, Credit, Logistics, Marketing)`);
  console.log(`📊 MongoDB: ${usuariosMongoDB.length} usuarios (Catalog, Social, AI)`);
  console.log('📧 Email: [rol]@estilomoda.com');
  console.log('🔑 Contraseña: admin123');
}

main().catch(console.error);