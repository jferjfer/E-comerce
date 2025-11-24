const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function probarArmonizacion() {
  console.log('🔄 Probando armonización Frontend ↔ Backend\n');
  
  const pruebas = [
    {
      nombre: '📦 Productos',
      url: `${API_BASE}/api/productos`,
      validar: (data) => {
        return data.productos && Array.isArray(data.productos) && data.productos.length > 0;
      }
    },
    {
      nombre: '⭐ Productos Destacados',
      url: `${API_BASE}/api/productos/destacados`,
      validar: (data) => {
        return data.productos && Array.isArray(data.productos) && data.productos.length > 0;
      }
    },
    {
      nombre: '📂 Categorías',
      url: `${API_BASE}/api/categorias`,
      validar: (data) => {
        return data.categorias && Array.isArray(data.categorias) && data.categorias.length > 0;
      }
    },
    {
      nombre: '🔐 Login Demo',
      url: `${API_BASE}/api/auth/login`,
      metodo: 'POST',
      datos: { email: 'demo@estilomoda.com', password: 'admin123' },
      validar: (data) => {
        return data.token && data.usuario && data.usuario.email === 'demo@estilomoda.com';
      }
    }
  ];
  
  let exitosos = 0;
  let fallidos = 0;
  
  for (const prueba of pruebas) {
    try {
      console.log(`Probando ${prueba.nombre}...`);
      
      let response;
      if (prueba.metodo === 'POST') {
        response = await axios.post(prueba.url, prueba.datos);
      } else {
        response = await axios.get(prueba.url);
      }
      
      if (prueba.validar(response.data)) {
        console.log(`✅ ${prueba.nombre} - OK`);
        if (prueba.nombre === '📦 Productos') {
          console.log(`   └─ ${response.data.productos.length} productos encontrados`);
        } else if (prueba.nombre === '📂 Categorías') {
          console.log(`   └─ ${response.data.categorias.length} categorías encontradas`);
        } else if (prueba.nombre === '🔐 Login Demo') {
          console.log(`   └─ Usuario: ${response.data.usuario.nombre} (${response.data.usuario.rol})`);
        }
        exitosos++;
      } else {
        console.log(`❌ ${prueba.nombre} - Formato inválido`);
        fallidos++;
      }
    } catch (error) {
      console.log(`❌ ${prueba.nombre} - Error: ${error.message}`);
      fallidos++;
    }
    
    console.log('');
  }
  
  console.log('📊 Resumen de Armonización:');
  console.log(`✅ Exitosos: ${exitosos}`);
  console.log(`❌ Fallidos: ${fallidos}`);
  console.log(`📈 Porcentaje de éxito: ${Math.round((exitosos / pruebas.length) * 100)}%`);
  
  if (exitosos === pruebas.length) {
    console.log('\n🎉 ¡Frontend y Backend están perfectamente armonizados!');
  } else {
    console.log('\n⚠️  Hay problemas de armonización que necesitan atención.');
  }
}

// Ejecutar pruebas
probarArmonizacion().catch(console.error);