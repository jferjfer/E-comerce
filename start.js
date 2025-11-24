const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Estilo y Moda E-Commerce...\n');

// Función para liberar puertos
function liberarPuertos() {
  return new Promise((resolve) => {
    console.log('🛑 Liberando puertos...');
    
    const comandos = [
      'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3000\') do taskkill /F /PID %a',
      'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3001\') do taskkill /F /PID %a',
      'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :3005\') do taskkill /F /PID %a'
    ];
    
    let completados = 0;
    comandos.forEach(cmd => {
      exec(cmd, () => {
        completados++;
        if (completados === comandos.length) {
          console.log('✅ Puertos liberados\n');
          setTimeout(resolve, 1000);
        }
      });
    });
  });
}

// Rutas de los servicios
const services = [
  {
    name: '🔐 Auth Service',
    cwd: path.join(__dirname, 'backend', 'services', 'auth-service'),
    command: 'npm',
    args: ['run', 'desarrollo'],
    port: 3011
  },
  {
    name: '🌐 API Gateway', 
    cwd: path.join(__dirname, 'backend'),
    command: 'npm',
    args: ['run', 'desarrollo'],
    port: 3000
  },
  {
    name: '🎨 Frontend',
    cwd: path.join(__dirname, 'frontend'),
    command: 'npm',
    args: ['run', 'dev'],
    port: 3005
  }
];

// Liberar puertos e iniciar servicios
liberarPuertos().then(() => {
  services.forEach((service, index) => {
    setTimeout(() => {
      console.log(`Iniciando ${service.name} en puerto ${service.port}...`);
      
      const child = spawn(service.command, service.args, {
        cwd: service.cwd,
        stdio: 'inherit',
        shell: true
      });

      child.on('error', (err) => {
        console.error(`❌ Error en ${service.name}:`, err.message);
      });

    }, index * 3000); // 3 segundos entre cada servicio
  });
});

console.log('\n📱 URLs disponibles:');
console.log('   • Frontend: http://localhost:3005');
console.log('   • API Gateway: http://localhost:3000');
console.log('   • Auth Service: http://localhost:3011');
console.log('\n👤 Usuario demo: demo@estilomoda.com / admin123');
console.log('\n⚠️  Presiona Ctrl+C para detener todos los servicios\n');