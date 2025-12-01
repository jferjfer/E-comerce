const { Client } = require('pg');
const { MongoClient } = require('mongodb');

// PostgreSQL Neon - Auth Service
const PG_AUTH = 'postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';

// PostgreSQL Neon - Transaction Service
const PG_TRANSACTION = 'postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

// MongoDB Atlas
const MONGO_URI = 'mongodb+srv://jfvertel:jfvertel123@cluster0.vvagb.mongodb.net/ecommerce?retryWrites=true&w=majority';

async function auditarPostgreSQL(nombre, connectionString) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 AUDITORÍA: ${nombre}`);
  console.log('='.repeat(60));
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado\n');
    
    // Listar tablas
    const tablas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📋 TABLAS (${tablas.rows.length}):`);
    for (const row of tablas.rows) {
      console.log(`   • ${row.table_name}`);
      
      // Contar registros
      try {
        const count = await client.query(`SELECT COUNT(*) FROM ${row.table_name}`);
        console.log(`     └─ ${count.rows[0].count} registros`);
      } catch (e) {
        console.log(`     └─ Error contando: ${e.message}`);
      }
    }
    
    // Verificar constraints
    console.log('\n🔒 CONSTRAINTS:');
    const constraints = await client.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type
    `);
    
    for (const row of constraints.rows) {
      console.log(`   • ${row.table_name}.${row.constraint_name} (${row.constraint_type})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

async function auditarMongoDB() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 AUDITORÍA: MongoDB Atlas');
  console.log('='.repeat(60));
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado\n');
    
    const db = client.db('ecommerce');
    const collections = await db.listCollections().toArray();
    
    console.log(`📋 COLECCIONES (${collections.length}):`);
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   • ${col.name} - ${count} documentos`);
      
      // Mostrar un documento de ejemplo
      if (count > 0) {
        const sample = await db.collection(col.name).findOne();
        console.log(`     └─ Campos: ${Object.keys(sample).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('\n🔍 AUDITORÍA COMPLETA DE BASES DE DATOS VERCEL\n');
  
  await auditarPostgreSQL('PostgreSQL Auth (Neon 1)', PG_AUTH);
  await auditarPostgreSQL('PostgreSQL Transaction (Neon 2)', PG_TRANSACTION);
  await auditarMongoDB();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ AUDITORÍA COMPLETADA');
  console.log('='.repeat(60) + '\n');
}

main();
