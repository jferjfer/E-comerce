#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🎨 Iniciando Frontend - Estilo y Moda');
console.log('📍 URL: http://localhost:3005\n');

const frontendPath = path.join(__dirname, 'frontend');

const proceso = spawn('npm', ['run', 'dev'], {
  cwd: frontendPath,
  stdio: 'inherit',
  shell: true
});

proceso.on('close', (codigo) => {
  if (codigo !== 0) {
    console.error(`❌ Frontend terminó con código ${codigo}`);
  }
});

proceso.on('error', (error) => {
  console.error('❌ Error iniciando frontend:', error);
});