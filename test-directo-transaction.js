const axios = require('axios');

async function test() {
  try {
    // Login
    const login = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'demo@estilomoda.com',
      password: 'admin123'
    });
    
    const token = login.data.token;
    console.log('✅ Token:', token.substring(0, 30));
    
    // Agregar directo a transaction-service (sin gateway)
    console.log('\n📦 Agregando directo a transaction-service...');
    const agregar = await axios.post('http://localhost:3003/api/carrito', {
      id_producto: '1',
      cantidad: 2
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    
    console.log('✅ Respuesta:', agregar.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Respuesta:', error.response.data);
    }
  }
}

test();
