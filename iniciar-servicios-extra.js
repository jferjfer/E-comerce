#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('⚡ Iniciando Servicios Extra - Estilo y Moda');
console.log('📋 Servicios: Catalog + Transaction + Social + Marketing + AI');
console.log('📍 URLs:');
console.log('   • Catalog Service: http://localhost:3002');
console.log('   • Transaction Service: http://localhost:3003');
console.log('   • Social Service: http://localhost:3004');
console.log('   • Marketing Service: http://localhost:3006');
console.log('   • AI Service: http://localhost:3007');
console.log('');

const servicios = [
  {
    nombre: '📦 Catalog Service',
    comando: 'python',
    args: ['src/main.py'],
    cwd: path.join(__dirname, 'backend', 'services', 'catalog-service')
  },
  {
    nombre: '🛒 Transaction Service',
    comando: 'node',
    args: ['src/servidor.js'],
    cwd: path.join(__dirname, 'backend', 'services', 'transaction-service')
  },
  {
    nombre: '👥 Social Service',
    comando: 'node',
    args: ['src/servidor-completo.js'],
    cwd: path.join(__dirname, 'backend', 'services', 'social-service')
  },
  {
    nombre: '📢 Marketing Service',
    comando: 'node',
    args: ['src/servidor-completo.js'],
    cwd: path.join(__dirname, 'backend', 'services', 'marketing-service')
  },
  {
    nombre: '🤖 AI Service',
    comando: 'python',
    args: ['src/main-completo.py'],
    cwd: path.join(__dirname, 'backend', 'services', 'ai-service')
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
  }, index * 3000); // 3 segundos entre cada servicio
});

// Manejar cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servicios extra...');
  procesos.forEach(proceso => {
    if (proceso && !proceso.killed) {
      proceso.kill('SIGINT');
    }
  });
  process.exit(0);
});