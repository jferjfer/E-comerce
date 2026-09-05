const bcrypt = require('bcryptjs');
const pool = require('../src/config/baseDatos');

const usuariosDemo = [
  // NIVEL EJECUTIVO
  { email: 'ceo@egos.com.co', nombre: 'Fernando Vertel', rol: 'ceo', password: 'admin123' },
  { email: 'cfo@egos.com.co', nombre: 'Ana García CFO', rol: 'cfo', password: 'admin123' },
  { email: 'cmo@egos.com.co', nombre: 'Carlos López CMO', rol: 'cmo', password: 'admin123' },
  
  // NIVEL DIRECTIVO
  { email: 'operations@egos.com.co', nombre: 'María Operations', rol: 'operations_director', password: 'admin123' },
  { email: 'tech@egos.com.co', nombre: 'José Tech Director', rol: 'tech_director', password: 'admin123' },
  { email: 'regional@egos.com.co', nombre: 'Laura Regional Manager', rol: 'regional_manager', password: 'admin123' },
  
  // NIVEL GERENCIAL
  { email: 'category@egos.com.co', nombre: 'Pedro Category Manager', rol: 'category_manager', password: 'admin123' },
  { email: 'brand@egos.com.co', nombre: 'Sofia Brand Manager', rol: 'brand_manager', password: 'admin123' },
  { email: 'inventory@egos.com.co', nombre: 'Diego Inventory Manager', rol: 'inventory_manager', password: 'admin123' },
  { email: 'marketing@egos.com.co', nombre: 'Carmen Marketing Manager', rol: 'marketing_manager', password: 'admin123' },
  
  // NIVEL OPERATIVO
  { email: 'product@egos.com.co', nombre: 'Roberto Product Manager', rol: 'product_manager', password: 'admin123' },
  { email: 'pricing@egos.com.co', nombre: 'Elena Pricing Analyst', rol: 'pricing_analyst', password: 'admin123' },
  { email: 'content@egos.com.co', nombre: 'Andrea Content Editor', rol: 'content_editor', password: 'admin123' },
  { email: 'visual@egos.com.co', nombre: 'Miguel Visual Merchandiser', rol: 'visual_merchandiser', password: 'admin123' },
  { email: 'photo@egos.com.co', nombre: 'Lucia Photographer', rol: 'photographer', password: 'admin123' },
  { email: 'success@egos.com.co', nombre: 'Patricia Customer Success', rol: 'customer_success', password: 'admin123' },
  { email: 'support@egos.com.co', nombre: 'Raul Support Agent', rol: 'support_agent', password: 'admin123' },
  { email: 'logistics@egos.com.co', nombre: 'Fernando Logistics', rol: 'logistics_coordinator', password: 'admin123' },
  { email: 'qa@egos.com.co', nombre: 'Gabriela QA Specialist', rol: 'qa_specialist', password: 'admin123' },
  
  // VENDEDORES
  { email: 'seller1@egos.com.co', nombre: 'Juan Seller Premium', rol: 'seller_premium', password: 'admin123' },
  { email: 'seller2@egos.com.co', nombre: 'Isabel Seller Standard', rol: 'seller_standard', password: 'admin123' },
  { email: 'seller3@egos.com.co', nombre: 'Manuel Seller Basic', rol: 'seller_basic', password: 'admin123' },
  
  // CLIENTES
  { email: 'vip@egos.com.co', nombre: 'Isabella Cliente VIP', rol: 'vip_customer', password: 'admin123' },
  { email: 'premium@egos.com.co', nombre: 'Alejandro Cliente Premium', rol: 'premium_customer', password: 'admin123' },
  { email: 'regular@egos.com.co', nombre: 'Camila Cliente Regular', rol: 'regular_customer', password: 'admin123' }
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
    console.log('   • CEO: ceo@egos.com.co / admin123');
    console.log('   • CFO: cfo@egos.com.co / admin123');
    console.log('   • CMO: cmo@egos.com.co / admin123');
    console.log('   • Product Manager: product@egos.com.co / admin123');
    console.log('   • Seller Premium: seller1@egos.com.co / admin123');
    console.log('   • Cliente VIP: vip@egos.com.co / admin123');
    console.log('   • Cliente Regular: regular@egos.com.co / admin123');
    console.log('   • ... y 17 usuarios más');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar script
crearUsuariosDemo();