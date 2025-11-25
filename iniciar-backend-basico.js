#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Iniciando Backend Básico - Estilo y Moda');
console.log('📋 Servicios: Simple Gateway + Auth Service');
console.log('📍 URLs:');
console.log('   • Simple Gateway: http://localhost:3000');
console.log('   • Auth Service: http://localhost:3011');
console.log('');

// Limpiar puertos antes de iniciar
const { exec } = require('child_process');
const puertosLimpiar = [3000, 3011];

function limpiarPuertos() {
  puertosLimpiar.forEach(puerto => {
    exec(`netstat -ano | findstr :${puerto}`, (error, stdout) => {
      if (stdout) {
        const lineas = stdout.split('\n').filter(linea => linea.includes('LISTENING'));
        lineas.forEach(linea => {
          const partes = linea.trim().split(/\s+/);
          const pid = partes[partes.length - 1];
          if (pid && pid !== '0') {
            exec(`taskkill /PID ${pid} /F`);
          }
        });
      }
    });
  });
}

limpiarPuertos();
console.log('🧹 Limpiando puertos...');
setTimeout(() => {
  console.log('✅ Puertos limpiados, iniciando servicios...\n');
  iniciarServicios();
}, 2000);

function iniciarServicios() {

const servicios = [
  {
    nombre: '🌐 Simple Gateway',
    comando: 'node',
    args: ['server.js'],
    cwd: path.join(__dirname, 'simple-gateway')
  },
  {
    nombre: '🔐 Auth Service',
    comando: 'npm', 
    args: ['run', 'desarrollo'],
    cwd: path.join(__dirname, 'backend', 'services', 'auth-service')
  }
];

const procesos = [];

  servicios.forEach((servicio, index) => {
    setTimeout(() => {
      console.log(`Iniciando ${servicio.nombre}...`);
      
      const proceso = spawn(servicio.comando, servicio.args, {
        cwd: servicio.cwd,
        stdio: 'inherit',
        shell: true
      });

      proceso.on('error', (error) => {
        console.error(`❌ Error en ${servicio.nombre}:`, error);
      });

      procesos.push(proceso);
    }, index * 2000); // 2 segundos entre cada servicio
  });
}

// Manejar cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servicios...');
  procesos.forEach(proceso => {
    if (proceso && !proceso.killed) {
      proceso.kill('SIGINT');
    }
  });
  process.exit(0);
});