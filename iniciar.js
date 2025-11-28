const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Estilo y Moda - E-Commerce Completo\n');

// Configuración de servicios
const servicios = [
  { nombre: '🔐 Auth', dir: 'backend/services/auth-service', cmd: 'npm', args: ['run', 'desarrollo'], puerto: 3011 },
  { nombre: '📦 Catalog', dir: 'backend/services/catalog-service', cmd: 'uvicorn', args: ['src.main:app', '--host', '0.0.0.0', '--port', '3002', '--reload'], puerto: 3002 },
  { nombre: '🛒 Transaction', dir: 'backend/services/transaction-service', cmd: 'node', args: ['src/servidor.js'], puerto: 3003 },
  { nombre: '👥 Social', dir: 'backend/services/social-service', cmd: 'node', args: ['src/servidor-completo.js'], puerto: 3004 },
  { nombre: '📢 Marketing', dir: 'backend/services/marketing-service', cmd: 'node', args: ['src/servidor-completo.js'], puerto: 3006 },
  { nombre: '🤖 AI', dir: 'backend/services/ai-service', cmd: 'uvicorn', args: ['src.main:app', '--host', '0.0.0.0', '--port', '3007', '--reload'], puerto: 3007 },
  { nombre: '💳 Credit', dir: 'backend/services/credit-service', cmd: 'mvn', args: ['spring-boot:run'], puerto: 3008 },
  { nombre: '🚛 Logistics', dir: 'backend/services/logistics-service', cmd: 'mvn', args: ['spring-boot:run'], puerto: 3009 },
  { nombre: '🌐 Gateway', dir: 'simple-gateway', cmd: 'node', args: ['server.js'], puerto: 3000 },
  { nombre: '🎨 Frontend', dir: 'frontend', cmd: 'npm', args: ['run', 'dev'], puerto: 3005 }
];

const procesos = [];

// Limpiar puertos
async function limpiarPuertos() {
  console.log('🧹 Limpiando puertos...');
  const puertos = servicios.map(s => s.puerto);
  
  for (const puerto of puertos) {
    await new Promise(resolve => {
      exec(`netstat -ano | findstr :${puerto}`, (error, stdout) => {
        if (stdout) {
          const lineas = stdout.split('\n').filter(l => l.includes('LISTENING'));
          lineas.forEach(linea => {
            const pid = linea.trim().split(/\s+/).pop();
            if (pid && pid !== '0') {
              exec(`taskkill /PID ${pid} /F`, () => {});
            }
          });
        }
        resolve();
      });
    });
  }
  console.log('✅ Puertos limpiados\n');
}

// Iniciar servicio
function iniciarServicio(servicio, delay = 0) {
  setTimeout(() => {
    console.log(`Iniciando ${servicio.nombre}...`);
    
    const proceso = spawn(servicio.cmd, servicio.args, {
      cwd: path.join(__dirname, servicio.dir),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PUERTO: servicio.puerto }
    });

    proceso.on('error', (err) => {
      console.error(`❌ Error en ${servicio.nombre}: ${err.message}`);
    });

    procesos.push({ nombre: servicio.nombre, proceso, puerto: servicio.puerto });
  }, delay);
}

// Iniciar sistema
async function iniciar() {
  await limpiarPuertos();
  
  // Iniciar servicios con delays
  servicios.forEach((servicio, index) => {
    iniciarServicio(servicio, index * 2500);
  });

  // Mostrar URLs después de 20 segundos
  setTimeout(() => {
    console.log('\n🎉 SISTEMA COMPLETO INICIADO!\n');
    console.log('📱 URLs Principales:');
    console.log('   • 🎨 Frontend: http://localhost:3005');
    console.log('   • 🌐 Gateway: http://localhost:3000');
    console.log('   • 📊 Estado: http://localhost:3000/estado-servicios\n');
    console.log('🔧 Microservicios:');
    console.log('   • 🔐 Auth: http://localhost:3011/salud');
    console.log('   • 📦 Catalog: http://localhost:3002/salud');
    console.log('   • 🛒 Transaction: http://localhost:3003/salud');
    console.log('   • 👥 Social: http://localhost:3004/salud');
    console.log('   • 📢 Marketing: http://localhost:3006/salud');
    console.log('   • 🤖 AI: http://localhost:3007/salud');
    console.log('   • 💳 Credit: http://localhost:3008/actuator/health');
    console.log('   • 🚛 Logistics: http://localhost:3009/actuator/health\n');
    console.log('👤 Usuarios Demo:');
    console.log('   • Cliente: demo@estilomoda.com / admin123');
    console.log('   • Admin: admin@estilomoda.com / admin123');
    console.log('   • CEO: ceo@estilomoda.com / admin123');
    console.log('   • VIP: vip@estilomoda.com / admin123\n');
    console.log('✨ Funcionalidades:');
    console.log('   ✅ Autenticación completa con roles');
    console.log('   ✅ Catálogo con filtros y búsqueda');
    console.log('   ✅ Carrito y checkout');
    console.log('   ✅ Reseñas y listas de deseos');
    console.log('   ✅ Sistema de cupones y fidelización');
    console.log('   ✅ Recomendaciones IA');
    console.log('   ✅ Sistema de crédito');
    console.log('   ✅ Logística y entregas\n');
    console.log('⚠️ Presiona Ctrl+C para detener TODO el sistema\n');
  }, 20000);
}

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servicios...');
  procesos.forEach(({ nombre, proceso }) => {
    console.log(`Deteniendo ${nombre}...`);
    proceso.kill('SIGTERM');
  });
  setTimeout(() => {
    console.log('✅ Sistema detenido');
    process.exit(0);
  }, 2000);
});

iniciar();