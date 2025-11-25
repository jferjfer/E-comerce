const axios = require('axios');

const testRegistro = async () => {
  const usuario = {
    "email": "emarizalj.marual@gmail.com",
    "password": "Vertel13@",
    "nombre": "Erika",
    "apellido": "Arizal",
    "documento_tipo": "CC",
    "documento_numero": "1066750014",
    "telefono": "3103734243",
    "fecha_nacimiento": "1999-09-26",
    "genero": "",
    "direccion": "CRA 107 A BIS Nº69B58",
    "ciudad": "ENGATIVA",
    "departamento": "Bogotá",
    "acepta_terminos": true,
    "acepta_datos": true,
    "acepta_marketing": true
  };

  try {
    console.log('🚀 Simulando registro de usuario...\n');
    console.log('📧 Email:', usuario.email);
    console.log('👤 Nombre:', usuario.nombre, usuario.apellido);
    
    const inicio = Date.now();
    
    const response = await axios.post('http://localhost:3011/api/auth/register', usuario, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const tiempo = Date.now() - inicio;
    
    console.log('\n✅ REGISTRO EXITOSO');
    console.log(`⏱️ Tiempo: ${tiempo}ms`);
    console.log('📋 Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Test de login inmediato
    console.log('\n🔐 Probando login inmediato...');
    const loginResponse = await axios.post('http://localhost:3011/api/auth/login', {
      email: usuario.email,
      password: usuario.password
    });
    
    console.log('✅ LOGIN EXITOSO');
    console.log('🎫 Token recibido:', loginResponse.data.token ? 'SÍ' : 'NO');
    
  } catch (error) {
    console.error('\n❌ ERROR EN REGISTRO:');
    console.error('📊 Status:', error.response?.status);
    console.error('💬 Mensaje:', error.response?.data?.error || error.message);
    console.error('🔍 Detalles:', error.response?.data);
  }
};

testRegistro();