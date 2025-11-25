const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando TODOS los Microservicios - Estilo y Moda v2.0\n');

// Limpiar puertos primero
const puertos = [3000, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3011, 5173];

console.log('🧹 Limpiando puertos ocupados...');

async function limpiarPuerto(puerto) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${puerto}`, (error, stdout) => {
      if (stdout) {
        const lineas = stdout.split('\n').filter(linea => linea.includes('LISTENING'));
        
        lineas.forEach(linea => {
          const partes = linea.trim().split(/\s+/);
          const pid = partes[partes.length - 1];
          
          if (pid && pid !== '0') {
            exec(`taskkill /PID ${pid} /F`, (killError) => {
              if (!killError) {
                console.log(`✅ Puerto ${puerto} liberado`);
              }
            });
          }
        });
      }
      resolve();
    });
  });
}

async function limpiarTodosPuertos() {
  for (const puerto of puertos) {
    await limpiarPuerto(puerto);
  }
  
  console.log('🎉 Limpieza de puertos completada!');
  console.log('⏳ Esperando 3 segundos antes de iniciar servicios...\n');
  
  setTimeout(() => {
    iniciarTodosLosServicios();
  }, 3000);
}

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
    comando: 'uvicorn',
    argumentos: ['src.main:app', '--host', '0.0.0.0', '--port', '3002', '--reload'],
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
    comando: 'uvicorn',
    argumentos: ['src.main-completo:app', '--host', '0.0.0.0', '--port', '3007', '--reload'],
    puerto: 3007,
    delay: 10000
  },
  {
    nombre: '🌐 Simple Gateway',
    directorio: path.join(__dirname, 'simple-gateway'),
    comando: 'node',
    argumentos: ['server.js'],
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

// Capturar errores globales del sistema
process.on('uncaughtException', (err) => {
  console.error(`\n🚨 [${new Date().toISOString()}] SISTEMA - Error No Capturado:`);
  console.error(`   └─ Error: ${err.message}`);
  console.error(`   └─ Stack: ${err.stack}`);
  console.error(`   └─ Reiniciando servicios...\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n🚨 [${new Date().toISOString()}] SISTEMA - Promesa Rechazada:`);
  console.error(`   └─ Razón:`, reason);
  console.error(`   └─ Promesa:`, promise);
});

// Logging de inicio de servicios mejorado
function iniciarServicio(servicio) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const timestamp = new Date().toISOString();
      console.log(`\n🚀 [${timestamp}] Iniciando ${servicio.nombre} en puerto ${servicio.puerto}...`);
      
      const proceso = spawn(servicio.comando, servicio.argumentos, {
        cwd: servicio.directorio,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PUERTO: servicio.puerto }
      });

      proceso.on('error', (err) => {
        console.error(`\n❌ [${new Date().toISOString()}] ERROR en ${servicio.nombre}:`);
        console.error(`   └─ Comando: ${servicio.comando} ${servicio.argumentos.join(' ')}`);
        console.error(`   └─ Directorio: ${servicio.directorio}`);
        console.error(`   └─ Error: ${err.message}`);
        console.error(`   └─ Stack: ${err.stack}`);
      });

      proceso.on('exit', (code, signal) => {
        const timestamp = new Date().toISOString();
        if (code !== 0) {
          console.error(`\n⚠️ [${timestamp}] ${servicio.nombre} terminó inesperadamente:`);
          console.error(`   └─ Código de salida: ${code}`);
          console.error(`   └─ Señal: ${signal}`);
        } else {
          console.log(`\n✅ [${timestamp}] ${servicio.nombre} terminó correctamente`);
        }
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

// Iniciar el sistema completo
limpiarTodosPuertos().catch((err) => {
  console.error(`\n❌ Error al limpiar puertos:`, err);
  console.error('Continuando con el inicio de servicios...\n');
  iniciarTodosLosServicios();
});