const axios = require('axios');

const verificarConexiones = async () => {
  console.log('🔍 VERIFICACIÓN FINAL DE CONEXIONES BD\n');

  const servicios = [
    { nombre: '🔐 Auth Service', url: 'http://localhost:3011/salud', bd: 'PostgreSQL (Neon)' },
    { nombre: '📦 Catalog Service', url: 'http://localhost:3002/salud', bd: 'MongoDB Atlas' },
    { nombre: '🛒 Transaction Service', url: 'http://localhost:3003/salud', bd: 'PostgreSQL (Neon)' },
    { nombre: '👥 Social Service', url: 'http://localhost:3004/salud', bd: 'MongoDB Atlas' },
    { nombre: '📢 Marketing Service', url: 'http://localhost:3006/salud', bd: 'PostgreSQL (Neon)' },
    { nombre: '🤖 AI Service', url: 'http://localhost:3007/salud', bd: 'MongoDB Atlas' }
  ];

  let serviciosOK = 0;
  let serviciosError = 0;

  for (const servicio of servicios) {
    try {
      const response = await axios.get(servicio.url, { timeout: 5000 });
      console.log(`✅ ${servicio.nombre} - OK`);
      console.log(`   └─ BD: ${servicio.bd}`);
      console.log(`   └─ Estado: ${response.data.estado}`);
      console.log(`   └─ Versión: ${response.data.version || 'N/A'}`);
      
      if (response.data.mongodb_conectado !== undefined) {
        console.log(`   └─ MongoDB: ${response.data.mongodb_conectado ? 'Conectado' : 'Desconectado'}`);
      }
      
      serviciosOK++;
    } catch (error) {
      console.log(`❌ ${servicio.nombre} - ERROR`);
      console.log(`   └─ BD: ${servicio.bd}`);
      console.log(`   └─ Error: ${error.message}`);
      serviciosError++;
    }
    console.log('');
  }

  console.log('📊 RESUMEN:');
  console.log(`✅ Servicios OK: ${serviciosOK}/6`);
  console.log(`❌ Servicios Error: ${serviciosError}/6`);
  console.log(`📈 Disponibilidad: ${Math.round((serviciosOK / 6) * 100)}%`);

  return serviciosOK === 6;
};

verificarConexiones().then(todosOK => {
  if (todosOK) {
    console.log('\n🎉 TODAS LAS CONEXIONES BD ESTÁN OK - LISTO PARA PRUEBAS');
  } else {
    console.log('\n⚠️ HAY SERVICIOS CON PROBLEMAS DE CONEXIÓN BD');
  }
});