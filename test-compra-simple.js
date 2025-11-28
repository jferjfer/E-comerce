const axios = require('axios');

async function testCompraSimple() {
  console.log('🛍️ PRUEBA DE COMPRA SIMPLE\n');
  
  try {
    // PASO 1: Login directo
    console.log('🔐 1. Login...');
    const login = await axios.post('http://localhost:3011/api/auth/login', {
      email: 'demo@estilomoda.com',
      password: 'admin123'
    });
    
    const token = login.data.datos?.token || login.data.token;
    console.log('✅ Token obtenido:', token ? 'SÍ' : 'NO');
    
    // PASO 2: Verificar token
    console.log('\n🔍 2. Verificando token...');
    const verificar = await axios.get('http://localhost:3011/api/auth/verificar', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token válido:', verificar.data);
    
    // PASO 3: Obtener productos
    console.log('\n📦 3. Obteniendo productos...');
    const productos = await axios.get('http://localhost:3002/api/productos?limite=5');
    console.log(`✅ ${productos.data.productos.length} productos obtenidos`);
    
    const producto = productos.data.productos[0];
    console.log(`   Producto: ${producto.nombre} - $${producto.precio}`);
    
    // PASO 4: Usar gateway para carrito (bypass auth middleware temporalmente)
    console.log('\n🛒 4. Probando carrito vía gateway...');
    const carritoGateway = await axios.get('http://localhost:3000/api/carrito', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Carrito vía gateway:', carritoGateway.data);
    
    // PASO 5: Agregar producto vía gateway
    console.log('\n➕ 5. Agregando producto vía gateway...');
    const agregar = await axios.post('http://localhost:3000/api/carrito', {
      id_producto: producto.id.toString(),
      cantidad: 1
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Producto agregado:', agregar.data);
    
    // PASO 6: Checkout vía gateway
    console.log('\n💳 6. Checkout vía gateway...');
    const checkout = await axios.post('http://localhost:3000/api/checkout', {
      metodo_pago: 'tarjeta_credito',
      direccion_envio: 'Calle 123 #45-67'
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Checkout exitoso:', checkout.data);
    
    console.log('\n🎉 ¡COMPRA COMPLETADA!');
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(`URL: ${error.config?.url}`);
    console.error(`Status: ${error.response?.status}`);
    console.error(`Error: ${error.response?.data?.error || error.message}`);
    
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCompraSimple();