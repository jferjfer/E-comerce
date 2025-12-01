const { exec } = require('child_process');

const PUERTO = 3006;

console.log(`📢 Iniciando Marketing Service en puerto ${PUERTO}...`);

exec(`netstat -ano | findstr :${PUERTO}`, (error, stdout) => {
  if (stdout) {
    const lineas = stdout.split('\n').filter(l => l.includes('LISTENING'));
    if (lineas.length > 0) {
      const pid = lineas[0].trim().split(/\s+/).pop();
      if (pid && pid !== '0') {
        console.log(`🔪 Matando proceso ${pid} en puerto ${PUERTO}...`);
        exec(`taskkill /PID ${pid} /F`, () => {
          setTimeout(() => {
            console.log('✅ Puerto liberado, iniciando servicio...');
            require('./src/servidor.js');
          }, 1000);
        });
        return;
      }
    }
  }
  console.log('✅ Puerto libre, iniciando servicio...');
  require('./src/servidor.js');
});
