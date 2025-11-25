const axios = require('axios');

const testFlujoRegistroCompleto = async () => {
  const inicioTotal = Date.now();
  // Datos del formulario frontend (igual que LoginPage.tsx)
  const datosFormulario = {
    email: `test${Date.now()}@estilomoda.com`,
    password: "TestPass123@",
    nombre: "Usuario",
    apellido: "Prueba",
    documento_tipo: "CC",
    documento_numero: "1234567890",
    telefono: "3001234567",
    fecha_nacimiento: "1990-01-01",
    genero: "Masculino",
    direccion: "Calle 123 #45-67",
    ciudad: "Bogotá",
    departamento: "Bogotá",
    acepta_terminos: true,
    acepta_datos: true,
    acepta_marketing: true
  };

  console.log('🚀 INICIANDO TEST FLUJO COMPLETO DE REGISTRO\n');
  console.log('📧 Email:', datosFormulario.email);
  console.log('👤 Usuario:', datosFormulario.nombre, datosFormulario.apellido);

  try {
    // PASO 1: Verificar Gateway activo
    console.log('\n🔍 PASO 1: Verificando Gateway...');
    const gatewayCheck = await axios.get('http://localhost:3000/salud', { timeout: 3000 });
    console.log('✅ Gateway activo:', gatewayCheck.data.gateway);

    // PASO 2A: Intentar registro vía Gateway
    console.log('\n📝 PASO 2A: Intentando registro vía Gateway (Puerto 3000)...');
    let responseRegistro;
    let usandoGateway = true;
    
    try {
      const inicioGateway = Date.now();
      responseRegistro = await axios.post('http://localhost:3000/api/auth/register', datosFormulario, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      });
      console.log(`✅ Gateway funcionando en ${Date.now() - inicioGateway}ms`);
    } catch (gatewayError) {
      console.log('⚠️ Gateway timeout, usando auth-service directo...');
      usandoGateway = false;
    }
    
    // PASO 2B: Registro directo si Gateway falla
    if (!usandoGateway) {
      console.log('\n📝 PASO 2B: Registro directo vía Auth-Service (Puerto 3011)...');
      const inicioRegistro = Date.now();
      
      responseRegistro = await axios.post('http://localhost:3011/api/auth/register', datosFormulario, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      const tiempoRegistro = Date.now() - inicioRegistro;
      console.log(`✅ REGISTRO DIRECTO EXITOSO en ${tiempoRegistro}ms`);
    }
    
    console.log('📋 Respuesta:', JSON.stringify(responseRegistro.data, null, 2));

    // PASO 3: Verificar token recibido
    const token = responseRegistro.data.datos?.token;
    if (token) {
      console.log('\n🎫 PASO 3: Token JWT recibido ✅');
      console.log('🔑 Token válido:', token.length > 100 ? 'SÍ' : 'NO');
    } else {
      console.log('\n❌ PASO 3: No se recibió token');
    }

    // PASO 4: Login inmediato
    const loginUrl = usandoGateway ? 'http://localhost:3000/api/auth/login' : 'http://localhost:3011/api/auth/login';
    console.log(`\n🔐 PASO 4: Login inmediato vía ${usandoGateway ? 'Gateway' : 'Auth-Service'}...`);
    const inicioLogin = Date.now();
    
    const responseLogin = await axios.post(loginUrl, {
      email: datosFormulario.email,
      password: datosFormulario.password
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    const tiempoLogin = Date.now() - inicioLogin;
    console.log(`✅ LOGIN EXITOSO en ${tiempoLogin}ms`);
    console.log('🎫 Token login:', responseLogin.data.datos?.token ? 'RECIBIDO' : 'NO RECIBIDO');

    // PASO 5: Verificar usuario en sistema
    if (responseLogin.data.datos?.token) {
      console.log('\n👤 PASO 5: Verificando usuario autenticado...');
      const tokenLogin = responseLogin.data.datos.token;
      const verificarUrl = usandoGateway ? 'http://localhost:3000/api/auth/verificar' : 'http://localhost:3011/api/auth/verificar';
      
      const responseVerificar = await axios.get(verificarUrl, {
        headers: { 'Authorization': `Bearer ${tokenLogin}` },
        timeout: 5000
      });
      
      console.log('✅ Usuario verificado:', responseVerificar.data.usuario?.email);
      console.log('🏷️ Rol asignado:', responseVerificar.data.usuario?.rol);
    }

    // RESUMEN FINAL
    console.log('\n🎯 RESUMEN DEL FLUJO:');
    console.log(`${usandoGateway ? '✅' : '⚠️'} Gateway → Auth Service: ${usandoGateway ? 'FUNCIONAL' : 'TIMEOUT (usando directo)'}`);
    console.log('✅ Registro completo: EXITOSO');
    console.log('✅ Login inmediato: EXITOSO');
    console.log('✅ Autenticación: FUNCIONAL');
    console.log(`🔧 Método usado: ${usandoGateway ? 'Gateway (Puerto 3000)' : 'Auth-Service Directo (Puerto 3011)'}`);

  } catch (error) {
    console.error('\n❌ ERROR EN EL FLUJO:');
    console.error('🔍 Paso fallido:', error.config?.url || 'Desconocido');
    console.error('📊 Status:', error.response?.status);
    console.error('💬 Error:', error.response?.data?.error || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Servicio no disponible - Verificar que esté corriendo');
    }
  }
};

// Ejecutar test
testFlujoRegistroCompleto();