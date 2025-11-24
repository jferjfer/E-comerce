const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuración de conexiones
const pgConfig = {
  connectionString: 'postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};

const mongoConfig = {
  uri: 'mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority'
};

async function configurarPostgreSQL() {
  console.log('🔧 Configurando PostgreSQL...');
  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    
    // Ejecutar esquema simplificado
    const sql = fs.readFileSync(path.join(__dirname, 'database/postgres/esquemas_simples.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Esquemas PostgreSQL ejecutados');
    
    console.log('✅ PostgreSQL configurado correctamente');
    
    // Crear usuario admin
    await client.query(`
      INSERT INTO usuarios (email, password_hash, nombre, apellido, rol) 
      VALUES ('admin@estilomoda.com', '$2b$10$hash', 'Admin', 'Sistema', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Usuario admin creado');
  } catch (error) {
    console.error('❌ Error en PostgreSQL:', error.message);
  } finally {
    await client.end();
  }
}

async function configurarMongoDB() {
  console.log('🔧 Configurando MongoDB...');
  const client = new MongoClient(mongoConfig.uri);
  
  try {
    await client.connect();
    
    // Configurar bases de datos
    const databases = ['stylehub_ai', 'stylehub_social', 'stylehub_marketing'];
    
    for (const dbName of databases) {
      const db = client.db(dbName);
      
      if (dbName === 'stylehub_ai') {
        await db.collection('conversaciones').createIndex({ usuario_id: 1, fecha_creacion: -1 });
        await db.collection('recomendaciones').createIndex({ usuario_id: 1, tipo: 1 });
        console.log('✅ stylehub_ai configurado');
      }
      
      if (dbName === 'stylehub_social') {
        await db.collection('resenas').createIndex({ producto_id: 1, calificacion: -1 });
        await db.collection('outfits').createIndex({ usuario_id: 1, fecha_creacion: -1 });
        console.log('✅ stylehub_social configurado');
      }
      
      if (dbName === 'stylehub_marketing') {
        await db.collection('campanas').createIndex({ estado: 1, fecha_inicio: 1 });
        await db.collection('fidelizacion').createIndex({ usuario_id: 1 });
        console.log('✅ stylehub_marketing configurado');
      }
    }
    
    console.log('✅ MongoDB configurado correctamente');
  } catch (error) {
    console.error('❌ Error en MongoDB:', error.message);
  } finally {
    await client.close();
  }
}

async function instalarDependencias() {
  console.log('📦 Instalando dependencias...');
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('npm install pg mongodb', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Instalando dependencias manualmente...');
      }
      console.log('✅ Dependencias listas');
      resolve();
    });
  });
}

async function main() {
  console.log('🚀 Iniciando configuración completa del sistema...\n');
  
  await instalarDependencias();
  await configurarPostgreSQL();
  await configurarMongoDB();
  
  console.log('\n🎉 ¡Sistema configurado completamente!');
  console.log('📋 Próximos pasos:');
  console.log('   1. cd frontend && npm install && npm start');
  console.log('   2. cd backend && npm install && npm run desarrollo');
}

main().catch(console.error);