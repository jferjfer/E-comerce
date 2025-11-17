const axios = require('axios');

async function probarServicios() {
  console.log('🧪 Probando servicios del e-commerce...');
  console.log('='.repeat(50));

  const servicios = [
    { nombre: 'API Gateway', url: 'http://localhost:3000/salud' },
    { nombre: 'Auth Service', url: 'http://localhost:3001/salud' },
    { nombre: 'Catalog Service', url: 'http://localhost:3002/salud' },
    { nombre: 'Transaction Service', url: 'http://localhost:3003/salud' },
    { nombre: 'Social Service', url: 'http://localhost:3004/salud' },
    { nombre: 'Marketing Service', url: 'http://localhost:3006/salud' },
    { nombre: 'AI Service', url: 'http://localhost:3007/salud' },
    { nombre: 'Credit Service', url: 'http://localhost:3008/actuator/health' },
    { nombre: 'Logistics Service', url: 'http://localhost:3009/actuator/health' }
  ];

  let serviciosActivos = 0;
  let serviciosInactivos = 0;

  for (const servicio of servicios) {
    try {
      const respuesta = await axios.get(servicio.url, { 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      const estado = respuesta.data.estado || respuesta.data.status || 'activo';
      console.log(`✅ ${servicio.nombre.padEnd(20)}: ${estado}`);
      serviciosActivos++;
    } catch (error) {
      console.log(`❌ ${servicio.nombre.padEnd(20)}: ${error.code || error.message}`);
      serviciosInactivos++;
    }
  }
  
  console.log('='.repeat(50));
  console.log(`📊 Resumen: ${serviciosActivos} activos, ${serviciosInactivos} inactivos`);
  
  if (serviciosInactivos > 0) {
    console.log('\n💡 Para iniciar los servicios ejecuta: npm run iniciar');
    process.exit(1);
  } else {
    console.log('\n🎉 Todos los servicios están funcionando correctamente!');
  }
}

// Ejecutar pruebas
probarServicios().catch(console.error);