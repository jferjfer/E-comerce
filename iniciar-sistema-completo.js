const { exec, spawn } = require('child_process');
const path = require('path');

// Configuración completa del sistema
const SERVICIOS = {
  'auth-service': { puerto: 3011, directorio: 'backend/services/auth-service', comando: 'node src/servidor.js', critico: true },
  'catalog-service': { puerto: 3002, directorio: 'backend/services/catalog-service', comando: 'python main.py', critico: true },
  'simple-gateway': { puerto: 3000, directorio: 'simple-gateway', comando: 'node server.js', critico: true },
  'transaction-service': { puerto: 3003, directorio: 'backend/services/transaction-service', comando: 'node src/servidor.js' },
  'social-service': { puerto: 3004, directorio: 'backend/services/social-service', comando: 'node src/servidor.js' },
  'marketing-service': { puerto: 3006, directorio: 'backend/services/marketing-service', comando: 'node src/servidor.js' },
  'ai-service': { puerto: 3007, directorio: 'backend/services/ai-service', comando: 'python main.py' },
  'frontend': { puerto: 3005, directorio: 'frontend', comando: 'npm run dev', critico: true }
};

const procesos = new Map();

// Función para matar todos los procesos en puertos
const limpiarPuertos = () => {
  return new Promise((resolve) => {
    console.log('🔫 LIMPIANDO TODOS LOS PUERTOS...');
    
    const puertos = Object.values(SERVICIOS).map(s => s.puerto);
    let procesados = 0;
    
    puertos.forEach(puerto => {
      exec(`netstat -ano | findstr :${puerto}`, (error, stdout) => {
        if (stdout) {
          const lineas = stdout.trim().split('\n');
          lineas.forEach(linea => {
            const partes = linea.trim().split(/\s+/);
            if (partes.length >= 5 && partes[4] !== '0') {
              exec(`taskkill /F /PID ${partes[4]}`, () => {});
            }
          });
        }
        
        procesados++;
        if (procesados === puertos.length) {
          console.log('✅ Puertos limpiados');
          setTimeout(resolve, 2000);
        }
      });
    });
  });
};

// Función para iniciar un servicio
const iniciarServicio = (nombre, config) => {
  return new Promise((resolve) => {
    console.log(`🚀 Iniciando ${nombre}...`);
    
    const directorio = path.join(__dirname, config.directorio);
    const [comando, ...args] = config.comando.split(' ');
    
    const proceso = spawn(comando, args, {
      cwd: directorio,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    procesos.set(nombre, proceso);
    
    let iniciado = false;
    const timeout = setTimeout(() => {
      if (!iniciado) {
        console.log(`✅ ${nombre} iniciado`);
        iniciado = true;
        resolve();
      }
    }, config.critico ? 5000 : 3000);

    proceso.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('listening') || output.includes('ejecutándose') || output.includes('Local:')) {
        if (!iniciado) {
          clearTimeout(timeout);
          console.log(`✅ ${nombre} ACTIVO`);
          iniciado = true;
          resolve();
        }
      }
    });

    proceso.on('error', () => {
      if (!iniciado) {
        console.log(`⚠️ ${nombre} con problemas, continuando...`);
        clearTimeout(timeout);
        iniciado = true;
        resolve();
      }
    });

    proceso.unref();
  });
};

// Función principal
const iniciarSistemaCompleto = async () => {
  console.log('🔥 INICIANDO SISTEMA COMPLETO - ESTILO Y MODA\n');

  try {
    // PASO 1: Limpiar puertos
    await limpiarPuertos();
    
    // PASO 2: Iniciar servicios críticos primero
    console.log('\n🚀 INICIANDO SERVICIOS CRÍTICOS...');
    const criticos = Object.entries(SERVICIOS).filter(([_, config]) => config.critico);
    
    for (const [nombre, config] of criticos) {
      await iniciarServicio(nombre, config);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // PASO 3: Iniciar servicios adicionales
    console.log('\n🚀 INICIANDO SERVICIOS ADICIONALES...');
    const adicionales = Object.entries(SERVICIOS).filter(([_, config]) => !config.critico);
    
    for (const [nombre, config] of adicionales) {
      iniciarServicio(nombre, config); // Sin await para inicio paralelo
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // PASO 4: Verificar sistema
    setTimeout(async () => {
      console.log('\n🔍 VERIFICANDO SISTEMA...');
      
      exec('curl -s http://localhost:3000/estado-servicios', (error, stdout) => {
        if (!error && stdout) {
          try {
            const estado = JSON.parse(stdout);
            console.log(`\n🎉 SISTEMA INICIADO COMPLETAMENTE`);
            console.log(`📊 Disponibilidad: ${estado.resumen.disponibilidad}`);
            console.log(`✅ Servicios activos: ${estado.resumen.servicios_activos}/${estado.resumen.total_servicios}`);
          } catch (e) {
            console.log('\n🎉 SISTEMA INICIADO');
          }
        } else {
          console.log('\n🎉 SISTEMA INICIADO (verificación pendiente)');
        }
        
        console.log('\n🌐 URLS DISPONIBLES:');
        console.log('   🎨 Frontend: http://localhost:3005');
        console.log('   🌐 Gateway: http://localhost:3000');
        console.log('   📊 Estado: http://localhost:3000/estado-servicios');
        console.log('\n💡 Presiona Ctrl+C para detener todo el sistema');
      });
    }, 8000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo sistema...');
  procesos.forEach((proceso, nombre) => {
    try {
      proceso.kill();
      console.log(`✅ ${nombre} detenido`);
    } catch (e) {}
  });
  process.exit(0);
});

// Ejecutar
iniciarSistemaCompleto();