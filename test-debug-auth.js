const axios = require('axios');

async function debugAuth() {
  console.log('🔍 DEBUG DE AUTENTICACIÓN\n');
  
  try {
    // PASO 1: Login y obtener token
    console.log('1. Login...');
    const login = await axios.post('http://localhost:3011/api/auth/login', {
      email: 'demo@estilomoda.com',
      password: 'admin123'
    });
    
    console.log('Respuesta completa del login:');
    console.log(JSON.stringify(login.data, null, 2));
    
    const token = login.data.datos?.token || login.data.token;
    console.log('\nToken extraído:', token);
    
    // PASO 2: Verificar token directamente
    console.log('\n2. Verificando token directamente...');
    const verificar = await axios.get('http://localhost:3011/api/auth/verificar', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Verificación exitosa:');
    console.log(JSON.stringify(verificar.data, null, 2));
    
    // PASO 3: Probar carrito directo (sin gateway)
    console.log('\n3. Probando carrito directo...');
    try {
      const carrito = await axios.get('http://localhost:3003/api/carrito', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Carrito directo funciona:', carrito.data);
    } catch (error) {
      console.log('❌ Error carrito directo:', error.response?.data);
      
      // PASO 4: Verificar si el transaction service puede validar el token
      console.log('\n4. Verificando validación en transaction service...');
      try {
        const testAuth = await axios.get('http://localhost:3011/api/auth/verificar', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Auth service responde correctamente');
        
        // Verificar URL en transaction service
        console.log('URL que usa transaction service:', process.env.SERVICIO_AUTH_URL || 'http://localhost:3001');
        
      } catch (authError) {
        console.log('❌ Error en auth service:', authError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

debugAuth();