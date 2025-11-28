const axios = require('axios');

async function testCompra() {
  try {
    console.log('🔐 1. Login...');
    const login = await axios.post('http://localhost:3011/api/auth/login', {
      email: 'demo@estilomoda.com',
      password: 'admin123'
    });
    
    const token = login.data.token;
    console.log('✅ Token obtenido');
    
    console.log('\n🛒 2. Ver carrito...');
    const carrito = await axios.get('http://localhost:3003/api/carrito', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Carrito:', carrito.data);
    
    console.log('\n➕ 3. Agregar producto...');
    const agregar = await axios.post('http://localhost:3003/api/carrito', {
      id_producto: '1',
      cantidad: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Producto agregado:', agregar.data);
    
    console.log('\n💳 4. Checkout...');
    const checkout = await axios.post('http://localhost:3003/api/checkout', {
      metodo_pago: 'tarjeta',
      direccion_envio: 'Calle 123'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Pedido creado:', checkout.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCompra();