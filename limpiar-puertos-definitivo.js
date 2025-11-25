const { exec } = require('child_process');

const puertos = [3000, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3011, 5173];

console.log('🧹 Limpiando TODOS los puertos definitivamente...');

async function matarProcesoPorPuerto(puerto) {
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
                console.log(`✅ Puerto ${puerto} liberado (PID: ${pid})`);
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
    await matarProcesoPorPuerto(puerto);
    await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms entre cada puerto
  }
  
  console.log('🎉 Limpieza DEFINITIVA completada!');
  console.log('✅ Todos los puertos están libres');
}

limpiarTodosPuertos();