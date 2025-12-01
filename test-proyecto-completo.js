const axios = require('axios');

const API = 'http://localhost:3000';
let errores = 0;
let exitos = 0;

const test = async (nombre, fn) => {
  try {
    await fn();
    console.log(`✅ ${nombre}`);
    exitos++;
  } catch (error) {
    console.error(`❌ ${nombre}: ${error.message}`);
    errores++;
  }
};

async function testearProyecto() {
  console.log('\n🧪 TESTING COMPLETO DEL PROYECTO\n');
  console.log('═'.repeat(60));
  
  let token = '';
  let productoId = '';
  
  // 1. GATEWAY
  console.log('\n📡 GATEWAY');
  await test('Gateway activo', async () => {
    const res = await axios.get(`${API}/salud`);
    if (res.data.estado !== 'activo') throw new Error('Gateway inactivo');
  });
  
  await test('Estado de servicios', async () => {
    const res = await axios.get(`${API}/estado-servicios`);
    if (res.data.resumen.activos < 6) throw new Error('Servicios inactivos');
  });
  
  // 2. AUTH SERVICE
  console.log('\n🔐 AUTH SERVICE');
  await test('Login exitoso', async () => {
    const res = await axios.post(`${API}/api/auth/login`, {
      email: 'demo@estilomoda.com',
      password: 'admin123'
    });
    if (!res.data.token) throw new Error('Sin token');
    token = res.data.token;
  });
  
  await test('Verificar token', async () => {
    const res = await axios.get(`${API}/api/auth/verificar`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data.usuario) throw new Error('Token inválido');
  });
  
  // 3. CATALOG SERVICE
  console.log('\n📦 CATALOG SERVICE');
  await test('Listar productos', async () => {
    const res = await axios.get(`${API}/api/productos`);
    if (!res.data.productos || res.data.productos.length === 0) {
      throw new Error('Sin productos');
    }
    productoId = res.data.productos[0].id;
  });
  
  await test('Productos destacados', async () => {
    const res = await axios.get(`${API}/api/productos/destacados`);
    if (!res.data.productos) throw new Error('Sin destacados');
  });
  
  await test('Listar categorías', async () => {
    const res = await axios.get(`${API}/api/categorias`);
    if (!res.data.categorias) throw new Error('Sin categorías');
  });
  
  await test('Buscar productos', async () => {
    const res = await axios.get(`${API}/api/buscar?q=vestido`);
    if (!res.data.productos) throw new Error('Búsqueda falló');
  });
  
  // 4. TRANSACTION SERVICE
  console.log('\n🛒 TRANSACTION SERVICE');
  await test('Ver carrito vacío', async () => {
    const res = await axios.get(`${API}/api/carrito`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data.datos) throw new Error('Error carrito');
  });
  
  await test('Agregar al carrito', async () => {
    const res = await axios.post(`${API}/api/carrito`, {
      id_producto: productoId,
      cantidad: 2
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data.mensaje) throw new Error('No agregado');
  });
  
  await test('Ver carrito con productos', async () => {
    const res = await axios.get(`${API}/api/carrito`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.datos.productos.length === 0) {
      throw new Error('Carrito vacío');
    }
  });
  
  await test('Checkout exitoso', async () => {
    const res = await axios.post(`${API}/api/checkout`, {
      metodo_pago: 'tarjeta',
      direccion_envio: { direccion: 'Test 123' }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data.orden) throw new Error('Checkout falló');
  });
  
  await test('Carrito vacío después de checkout', async () => {
    const res = await axios.get(`${API}/api/carrito`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.datos.productos.length !== 0) {
      throw new Error('Carrito no se vació');
    }
  });
  
  // 5. SOCIAL SERVICE
  console.log('\n👥 SOCIAL SERVICE');
  await test('Listar reseñas', async () => {
    const res = await axios.get(`${API}/api/resenas/producto/${productoId}`);
    if (!res.data) throw new Error('Error reseñas');
  });
  
  // 6. MARKETING SERVICE
  console.log('\n📢 MARKETING SERVICE');
  await test('Listar cupones', async () => {
    const res = await axios.get(`${API}/api/cupones`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data) throw new Error('Error cupones');
  });
  
  // 7. AI SERVICE
  console.log('\n🤖 AI SERVICE');
  await test('Obtener recomendaciones', async () => {
    const res = await axios.get(`${API}/api/recomendaciones`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data) throw new Error('Error recomendaciones');
  });
  
  // RESUMEN
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('═'.repeat(60));
  console.log(`✅ Exitosos: ${exitos}`);
  console.log(`❌ Fallidos: ${errores}`);
  console.log(`📈 Tasa de éxito: ${Math.round((exitos / (exitos + errores)) * 100)}%`);
  console.log('═'.repeat(60));
  
  if (errores === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON! PROYECTO 100% FUNCIONAL\n');
  } else {
    console.log('\n⚠️ Algunos tests fallaron. Revisa los servicios.\n');
  }
}

testearProyecto();
