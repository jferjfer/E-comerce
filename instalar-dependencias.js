#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Instalando TODAS las dependencias - Estilo y Moda E-Commerce\n');

const servicios = [
  { nombre: '🎨 Frontend', ruta: 'frontend' },
  { nombre: '🌉 API Gateway', ruta: 'backend/api-gateway' },
  { nombre: '🔐 Auth Service', ruta: 'backend/services/auth-service' },
  { nombre: '🛒 Transaction Service', ruta: 'backend/services/transaction-service' },
  { nombre: '👥 Social Service', ruta: 'backend/services/social-service' },
  { nombre: '📢 Marketing Service', ruta: 'backend/services/marketing-service' }
];

async function ejecutarComando(comando, args, cwd) {
  return new Promise((resolve, reject) => {
    const proceso = spawn(comando, args, { 
      cwd, 
      stdio: 'inherit', 
      shell: true 
    });
    
    proceso.on('close', (codigo) => {
      if (codigo === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${codigo}`));
      }
    });
  });
}

async function instalarDependencias() {
  console.log('📦 Instalando nodemon globalmente...');
  try {
    await ejecutarComando('npm', ['install', '-g', 'nodemon'], process.cwd());
    console.log('✅ Nodemon instalado globalmente\n');
  } catch (error) {
    console.log('⚠️ Error instalando nodemon (puede que ya esté instalado)\n');
  }

  for (const servicio of servicios) {
    const rutaCompleta = path.join(process.cwd(), servicio.ruta);
    
    if (fs.existsSync(path.join(rutaCompleta, 'package.json'))) {
      console.log(`📦 Instalando dependencias de ${servicio.nombre}...`);
      try {
        await ejecutarComando('npm', ['install'], rutaCompleta);
        console.log(`✅ ${servicio.nombre} - Dependencias instaladas\n`);
      } catch (error) {
        console.log(`❌ ${servicio.nombre} - Error: ${error.message}\n`);
      }
    } else {
      console.log(`⚠️ ${servicio.nombre} - No se encontró package.json\n`);
    }
  }

  console.log('🎉 ¡Instalación de dependencias Node.js completada!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Activar entorno virtual Python: venv\\Scripts\\activate');
  console.log('2. Instalar dependencias Python: pip install -r requirements.txt');
  console.log('3. Ejecutar sistema: npm run dev-completo');
}

instalarDependencias().catch(console.error);