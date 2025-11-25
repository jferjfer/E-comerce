const axios = require('axios');

const usuario = {
  "email": "erika.final@gmail.com",
  "password": "Vertel13@",
  "nombre": "Erika",
  "apellido": "Arizal",
  "documento_tipo": "CC",
  "documento_numero": "1066750014",
  "telefono": "3103734243",
  "fecha_nacimiento": "1999-09-26",
  "genero": "Femenino",
  "direccion": "CRA 107 A BIS Nº69B58",
  "ciudad": "ENGATIVA",
  "departamento": "Bogotá",
  "acepta_terminos": true,
  "acepta_datos": true,
  "acepta_marketing": true
};

const testFlujoCompleto = async () => {
  console.log('🧪 PRUEBA COMPLETA DEL FLUJO DE REGISTRO\n');
  console.log('👤 Usuario:', usuario.nombre, usuario.apellido);
  console.log('📧 Email:', usuario.email);
  console.log('👩 Género:', usuario.genero);
  console.log('─'.repeat(50));

  let tiempoTotal = Date.now();

  try {
    // PASO 1: Verificar Simple Gateway
    console.log('\n🔍 PASO 1: Verificando Simple Gateway...');
    let inicio = Date.now();
    
    const gatewayHealth = await axios.get('http://localhost:3000/salud', { timeout: 5000 });
    console.log(`✅ Simple Gateway OK (${Date.now() - inicio}ms)`);
    console.log(`   └─ Servicios configurados: ${gatewayHealth.data.servicios_configurados}`);

    // PASO 2: Verificar Auth Service directo
    console.log('\n🔍 PASO 2: Verificando Auth Service directo...');
    inicio = Date.now();
    
    const authHealth = await axios.get('http://localhost:3011/salud', { timeout: 5000 });
    console.log(`✅ Auth Service OK (${Date.now() - inicio}ms)`);
    console.log(`   └─ Versión: ${authHealth.data.version}`);

    // PASO 3: Registro vía Simple Gateway (flujo real)
    console.log('\n🚀 PASO 3: Registro vía Simple Gateway (flujo completo)...');
    inicio = Date.now();
    
    const registroGateway = await axios.post('http://localhost:3000/api/auth/register', usuario, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    const tiempoGateway = Date.now() - inicio;
    console.log(`✅ Registro vía Gateway OK (${tiempoGateway}ms)`);
    console.log(`   └─ Usuario ID: ${registroGateway.data.datos?.usuario?.id}`);
    console.log(`   └─ Token generado: ${registroGateway.data.datos?.token ? 'SÍ' : 'NO'}`);

    // PASO 4: Registro directo al Auth Service (comparación)
    console.log('\n🔄 PASO 4: Registro directo al Auth Service (comparación)...');
    
    // Cambiar email para evitar duplicado
    const usuarioDirecto = { ...usuario, email: 'erika.directo.final@gmail.com' };
    inicio = Date.now();
    
    const registroDirecto = await axios.post('http://localhost:3011/api/auth/register', usuarioDirecto, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    const tiempoDirecto = Date.now() - inicio;
    console.log(`✅ Registro directo OK (${tiempoDirecto}ms)`);
    console.log(`   └─ Usuario ID: ${registroDirecto.data.datos?.usuario?.id}`);

    // ANÁLISIS DE RENDIMIENTO
    console.log('\n📊 ANÁLISIS DE RENDIMIENTO:');
    console.log(`⏱️  Tiempo total: ${Date.now() - tiempoTotal}ms`);
    console.log(`🌐 Vía Gateway: ${tiempoGateway}ms`);
    console.log(`🔐 Directo Auth: ${tiempoDirecto}ms`);
    console.log(`📈 Overhead Gateway: ${tiempoGateway - tiempoDirecto}ms`);
    
    if (tiempoGateway > 5000) {
      console.log('🚨 PROBLEMA: Gateway muy lento (>5s)');
    } else if (tiempoDirecto > 3000) {
      console.log('🚨 PROBLEMA: Auth Service lento (>3s)');
    } else {
      console.log('✅ RENDIMIENTO: Aceptable');
    }

    // PASO 5: Test de login
    console.log('\n🔐 PASO 5: Test de login inmediato...');
    inicio = Date.now();
    
    const login = await axios.post('http://localhost:3000/api/auth/login', {
      email: usuario.email,
      password: usuario.password
    });
    
    console.log(`✅ Login OK (${Date.now() - inicio}ms)`);
    console.log(`   └─ Token válido: ${login.data.datos?.token ? 'SÍ' : 'NO'}`);

  } catch (error) {
    console.error('\n❌ ERROR EN EL FLUJO:');
    console.error(`📍 Paso fallido: ${error.config?.url || 'Desconocido'}`);
    console.error(`⏱️  Tiempo transcurrido: ${Date.now() - tiempoTotal}ms`);
    console.error(`📊 Status: ${error.response?.status || 'Sin respuesta'}`);
    console.error(`💬 Error: ${error.response?.data?.error || error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 DIAGNÓSTICO: Servicio no disponible');
    } else if (error.code === 'ECONNRESET') {
      console.error('🔌 DIAGNÓSTICO: Conexión interrumpida');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ DIAGNÓSTICO: Timeout - servicio muy lento');
    }
  }
};

testFlujoCompleto();