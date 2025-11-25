const { exec, spawn } = require('child_process');
const path = require('path');

// Configuración de servicios con puertos fijos
const SERVICIOS = {
  'simple-gateway': { puerto: 3000, directorio: 'simple-gateway', comando: 'node server.js' },
  'auth-service': { puerto: 3011, directorio: 'backend/services/auth-service', comando: 'node src/servidor.js' },
  'catalog-service': { puerto: 3002, directorio: 'backend/services/catalog-service', comando: 'python main.py' },
  'transaction-service': { puerto: 3003, directorio: 'backend/services/transaction-service', comando: 'node src/servidor.js' },
  'social-service': { puerto: 3004, directorio: 'backend/services/social-service', comando: 'node src/servidor.js' },
  'marketing-service': { puerto: 3006, directorio: 'backend/services/marketing-service', comando: 'node src/servidor.js' },
  'ai-service': { puerto: 3007, directorio: 'backend/services/ai-service', comando: 'python main.py' },
  'credit-service': { puerto: 3008, directorio: 'backend/services/credit-service', comando: 'java -jar target/credit-service.jar' },
  'logistics-service': { puerto: 3009, directorio: 'backend/services/logistics-service', comando: 'java -jar target/logistics-service.jar' },
  'frontend': { puerto: 3005, directorio: 'frontend', comando: 'npm run dev' }
};

// Función para matar proceso en puerto específico
const matarProcesoPuerto = (puerto) => {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${puerto}`, (error, stdout) => {
      if (error || !stdout) {
        console.log(`✅ Puerto ${puerto} libre`);
        return resolve();
      }

      const lineas = stdout.trim().split('\n');
      const pids = new Set();
      
      lineas.forEach(linea => {
        const partes = linea.trim().split(/\s+/);
        if (partes.length >= 5 && partes[1].includes(`:${puerto}`)) {
          const pid = partes[4];
          if (pid !== '0') pids.add(pid);
        }
      });

      if (pids.size === 0) {
        console.log(`✅ Puerto ${puerto} libre`);
        return resolve();
      }

      console.log(`🔫 Matando procesos en puerto ${puerto}: ${Array.from(pids).join(', ')}`);
      
      let procesosMatados = 0;
      pids.forEach(pid => {
        exec(`taskkill /F /PID ${pid}`, (killError) => {
          procesosMatados++;
          if (procesosMatados === pids.size) {
            setTimeout(() => {
              console.log(`✅ Puerto ${puerto} liberado`);
              resolve();
            }, 1000);
          }
        });
      });
    });
  });
};

// Función para iniciar servicio
const iniciarServicio = (nombre, config) => {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Iniciando ${nombre} en puerto ${config.puerto}...`);
    
    const directorio = path.join(__dirname, config.directorio);
    const [comando, ...args] = config.comando.split(' ');
    
    const proceso = spawn(comando, args, {
      cwd: directorio,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let iniciado = false;
    const timeout = setTimeout(() => {
      if (!iniciado) {
        console.log(`✅ ${nombre} iniciado (timeout)`);
        iniciado = true;
        resolve();
      }
    }, 3000);

    proceso.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[${nombre}] ${output.trim()}`);
      
      if (!iniciado && (output.includes('listening') || output.includes('ejecutándose') || output.includes('started'))) {
        clearTimeout(timeout);
        console.log(`✅ ${nombre} iniciado correctamente`);
        iniciado = true;
        resolve();
      }
    });

    proceso.stderr.on('data', (data) => {
      console.log(`[${nombre}] ERROR: ${data.toString().trim()}`);
    });

    proceso.on('error', (error) => {
      if (!iniciado) {
        console.error(`❌ Error iniciando ${nombre}:`, error.message);
        clearTimeout(timeout);
        reject(error);
      }
    });

    proceso.unref();
  });
};

// Función principal
const iniciarSistemaRobusto = async () => {
  console.log('🔥 INICIO ROBUSTO DEL SISTEMA - MATANDO PROCESOS EN PUERTOS\n');

  try {
    // PASO 1: Liberar todos los puertos
    console.log('🔫 PASO 1: Liberando puertos...');
    for (const [nombre, config] of Object.entries(SERVICIOS)) {
      await matarProcesoPuerto(config.puerto);
    }
    
    console.log('\n⏳ Esperando 2 segundos para estabilizar...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // PASO 2: Iniciar servicios en orden de prioridad
    console.log('🚀 PASO 2: Iniciando servicios...\n');
    
    const orden = [
      'auth-service',      // Crítico
      'catalog-service',   // Crítico  
      'simple-gateway',    // Proxy
      'transaction-service',
      'social-service',
      'marketing-service',
      'ai-service',
      'frontend'
    ];

    for (const nombre of orden) {
      if (SERVICIOS[nombre]) {
        try {
          await iniciarServicio(nombre, SERVICIOS[nombre]);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Falló ${nombre}, continuando...`);
        }
      }
    }

    console.log('\n🎉 SISTEMA INICIADO COMPLETAMENTE');
    console.log('🌐 URLs disponibles:');
    console.log('   Frontend: http://localhost:3005');
    console.log('   Gateway: http://localhost:3000');
    console.log('   Estado: http://localhost:3000/estado-servicios');

  } catch (error) {
    console.error('❌ Error en inicio robusto:', error);
  }
};

// Ejecutar
iniciarSistemaRobusto();