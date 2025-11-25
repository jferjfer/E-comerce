const bcrypt = require('bcryptjs');
const pool = require('../src/config/baseDatos');

const usuariosDemo = [
  // NIVEL EJECUTIVO
  { email: 'ceo@estilomoda.com', nombre: 'Fernando Vertel', rol: 'ceo', password: 'admin123' },
  { email: 'cfo@estilomoda.com', nombre: 'Ana García CFO', rol: 'cfo', password: 'admin123' },
  { email: 'cmo@estilomoda.com', nombre: 'Carlos López CMO', rol: 'cmo', password: 'admin123' },
  
  // NIVEL DIRECTIVO
  { email: 'operations@estilomoda.com', nombre: 'María Operations', rol: 'operations_director', password: 'admin123' },
  { email: 'tech@estilomoda.com', nombre: 'José Tech Director', rol: 'tech_director', password: 'admin123' },
  { email: 'regional@estilomoda.com', nombre: 'Laura Regional Manager', rol: 'regional_manager', password: 'admin123' },
  
  // NIVEL GERENCIAL
  { email: 'category@estilomoda.com', nombre: 'Pedro Category Manager', rol: 'category_manager', password: 'admin123' },
  { email: 'brand@estilomoda.com', nombre: 'Sofia Brand Manager', rol: 'brand_manager', password: 'admin123' },
  { email: 'inventory@estilomoda.com', nombre: 'Diego Inventory Manager', rol: 'inventory_manager', password: 'admin123' },
  { email: 'marketing@estilomoda.com', nombre: 'Carmen Marketing Manager', rol: 'marketing_manager', password: 'admin123' },
  
  // NIVEL OPERATIVO
  { email: 'product@estilomoda.com', nombre: 'Roberto Product Manager', rol: 'product_manager', password: 'admin123' },
  { email: 'pricing@estilomoda.com', nombre: 'Elena Pricing Analyst', rol: 'pricing_analyst', password: 'admin123' },
  { email: 'content@estilomoda.com', nombre: 'Andrea Content Editor', rol: 'content_editor', password: 'admin123' },
  { email: 'visual@estilomoda.com', nombre: 'Miguel Visual Merchandiser', rol: 'visual_merchandiser', password: 'admin123' },
  { email: 'photo@estilomoda.com', nombre: 'Lucia Photographer', rol: 'photographer', password: 'admin123' },
  { email: 'success@estilomoda.com', nombre: 'Patricia Customer Success', rol: 'customer_success', password: 'admin123' },
  { email: 'support@estilomoda.com', nombre: 'Raul Support Agent', rol: 'support_agent', password: 'admin123' },
  { email: 'logistics@estilomoda.com', nombre: 'Fernando Logistics', rol: 'logistics_coordinator', password: 'admin123' },
  { email: 'qa@estilomoda.com', nombre: 'Gabriela QA Specialist', rol: 'qa_specialist', password: 'admin123' },
  
  // VENDEDORES
  { email: 'seller1@estilomoda.com', nombre: 'Juan Seller Premium', rol: 'seller_premium', password: 'admin123' },
  { email: 'seller2@estilomoda.com', nombre: 'Isabel Seller Standard', rol: 'seller_standard', password: 'admin123' },
  { email: 'seller3@estilomoda.com', nombre: 'Manuel Seller Basic', rol: 'seller_basic', password: 'admin123' },
  
  // CLIENTES
  { email: 'vip@estilomoda.com', nombre: 'Isabella Cliente VIP', rol: 'vip_customer', password: 'admin123' },
  { email: 'premium@estilomoda.com', nombre: 'Alejandro Cliente Premium', rol: 'premium_customer', password: 'admin123' },
  { email: 'regular@estilomoda.com', nombre: 'Camila Cliente Regular', rol: 'regular_customer', password: 'admin123' }
];

async function crearUsuariosDemo() {
  console.log('🚀 Creando usuarios demo para todos los roles...\n');
  
  try {
    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'regular_customer',
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabla usuario verificada/creada');
    
    for (const usuario of usuariosDemo) {
      try {
        // Verificar si ya existe
        const existente = await pool.query('SELECT id FROM usuario WHERE email = $1', [usuario.email]);
        
        if (existente.rows.length > 0) {
          console.log(`⚠️  ${usuario.email} ya existe - saltando`);
          continue;
        }
        
        // Hashear contraseña
        const contrasenaHasheada = await bcrypt.hash(usuario.password, 12);
        
        // Insertar usuario
        const resultado = await pool.query(`
          INSERT INTO usuario (nombre, email, contrasena, rol)
          VALUES ($1, $2, $3, $4)
          RETURNING id, nombre, email, rol
        `, [usuario.nombre, usuario.email, contrasenaHasheada, usuario.rol]);
        
        console.log(`✅ ${usuario.rol.toUpperCase()}: ${usuario.email} - ${usuario.nombre}`);
        
      } catch (error) {
        console.error(`❌ Error creando ${usuario.email}:`, error.message);
      }
    }
    
    console.log('\n🎉 ¡Usuarios demo creados exitosamente!');
    console.log('\n📋 Usuarios disponibles:');
    console.log('   • CEO: ceo@estilomoda.com / admin123');
    console.log('   • CFO: cfo@estilomoda.com / admin123');
    console.log('   • CMO: cmo@estilomoda.com / admin123');
    console.log('   • Product Manager: product@estilomoda.com / admin123');
    console.log('   • Seller Premium: seller1@estilomoda.com / admin123');
    console.log('   • Cliente VIP: vip@estilomoda.com / admin123');
    console.log('   • Cliente Regular: regular@estilomoda.com / admin123');
    console.log('   • ... y 17 usuarios más');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar script
crearUsuariosDemo();