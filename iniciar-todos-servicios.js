const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando TODOS los Microservicios - Estilo y Moda v2.0\n');

// Configuración de todos los servicios
const servicios = [
  {
    nombre: '🔐 Auth Service',
    directorio: path.join(__dirname, 'backend', 'services', 'auth-service'),
    comando: 'npm',
    argumentos: ['run', 'desarrollo'],
    puerto: 3011,
    delay: 0
  },
  {
    nombre: '📦 Catalog Service',
    directorio: path.join(__dirname, 'backend', 'services', 'catalog-service'),
    comando: 'python',
    argumentos: ['src/main.py'],
    puerto: 3002,
    delay: 2000
  },
  {
    nombre: '🛒 Transaction Service',
    directorio: path.join(__dirname, 'backend', 'services', 'transaction-service'),
    comando: 'node',
    argumentos: ['src/servidor.js'],
    puerto: 3003,
    delay: 4000
  },
  {
    nombre: '👥 Social Service',
    directorio: path.join(__dirname, 'backend', 'services', 'social-service'),
    comando: 'node',
    argumentos: ['src/servidor-completo.js'],
    puerto: 3004,
    delay: 6000
  },
  {
    nombre: '📢 Marketing Service',
    directorio: path.join(__dirname, 'backend', 'services', 'marketing-service'),
    comando: 'node',
    argumentos: ['src/servidor-completo.js'],
    puerto: 3006,
    delay: 8000
  },
  {
    nombre: '🤖 AI Service',
    directorio: path.join(__dirname, 'backend', 'services', 'ai-service'),
    comando: 'python',
    argumentos: ['src/main-completo.py'],
    puerto: 3007,
    delay: 10000
  },
  {
    nombre: '🌐 API Gateway',
    directorio: path.join(__dirname, 'backend'),
    comando: 'npm',
    argumentos: ['run', 'desarrollo'],
    puerto: 3000,
    delay: 12000
  },
  {
    nombre: '🎨 Frontend',
    directorio: path.join(__dirname, 'frontend'),
    comando: 'npm',
    argumentos: ['run', 'dev'],
    puerto: 3005,
    delay: 14000
  }
];

const procesosActivos = [];

// Función para iniciar un servicio
function iniciarServicio(servicio) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Iniciando ${servicio.nombre} en puerto ${servicio.puerto}...`);
      
      const proceso = spawn(servicio.comando, servicio.argumentos, {
        cwd: servicio.directorio,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PUERTO: servicio.puerto }
      });

      proceso.on('error', (err) => {
        console.error(`❌ Error en ${servicio.nombre}:`, err.message);
      });

      proceso.on('exit', (code) => {
        console.log(`⚠️ ${servicio.nombre} terminó con código ${code}`);
      });

      procesosActivos.push({
        nombre: servicio.nombre,
        proceso: proceso,
        puerto: servicio.puerto
      });

      resolve();
    }, servicio.delay);
  });
}

// Iniciar todos los servicios
async function iniciarTodosLosServicios() {
  console.log('🔄 Iniciando servicios en secuencia...\n');
  
  for (const servicio of servicios) {
    await iniciarServicio(servicio);
  }
  
  console.log('\n✅ Todos los servicios han sido iniciados!\n');
  
  console.log('📱 URLs disponibles:');
  console.log('   • Frontend: http://localhost:3005');
  console.log('   • API Gateway: http://localhost:3000');
  console.log('   • Estado Servicios: http://localhost:3000/estado-servicios');
  console.log('   • Auth Service: http://localhost:3011/salud');
  console.log('   • Catalog Service: http://localhost:3002/salud');
  console.log('   • Transaction Service: http://localhost:3003/salud');
  console.log('   • Social Service: http://localhost:3004/salud');
  console.log('   • Marketing Service: http://localhost:3006/salud');
  console.log('   • AI Service: http://localhost:3007/salud');
  
  console.log('\n👤 Usuarios demo:');
  console.log('   • Cliente: demo@estilomoda.com / admin123');
  console.log('   • Admin: admin@estilomoda.com / admin123');
  console.log('   • Vendedor: vendedor@estilomoda.com / admin123');
  
  console.log('\n🎯 Funcionalidades implementadas:');
  console.log('   ✅ Autenticación completa');
  console.log('   ✅ Catálogo con búsqueda y filtros');
  console.log('   ✅ Carrito y checkout');
  console.log('   ✅ Reseñas y listas de deseos');
  console.log('   ✅ Cupones y fidelización');
  console.log('   ✅ Recomendaciones IA');
  console.log('   ✅ Analytics de marketing');
  
  console.log('\n⚠️ Presiona Ctrl+C para detener todos los servicios\n');
}

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo todos los servicios...');
  
  procesosActivos.forEach(({ nombre, proceso }) => {
    console.log(`   Deteniendo ${nombre}...`);
    proceso.kill('SIGTERM');
  });
  
  setTimeout(() => {
    console.log('✅ Todos los servicios han sido detenidos.');
    process.exit(0);
  }, 2000);
});

// Iniciar el sistema completo
iniciarTodosLosServicios().catch(console.error);