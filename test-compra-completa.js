const axios = require('axios');

async function testCompraCompleta() {
  console.log('🛍️ SIMULACIÓN DE COMPRA COMPLETA\n');
  
  let token = null;
  let usuarioId = null;
  
  try {
    // PASO 1: Verificar servicios
    console.log('🔍 1. Verificando servicios...');
    
    const gateway = await axios.get('http://localhost:3000/salud');
    console.log('✅ Gateway activo');
    
    const auth = await axios.get('http://localhost:3011/salud');
    console.log('✅ Auth Service activo');
    
    const transaction = await axios.get('http://localhost:3003/salud');
    console.log('✅ Transaction Service activo');
    
    // PASO 2: Login
    console.log('\n🔐 2. Iniciando sesión...');
    const loginResponse = await axios.post('http://localhost:3011/api/auth/login', {
      email: 'demo@estilomoda.com',
      password: 'admin123'
    });
    
    token = loginResponse.data.datos?.token || loginResponse.data.token;
    usuarioId = loginResponse.data.datos?.usuario?.id || loginResponse.data.usuario?.id;
    
    console.log('✅ Login exitoso');
    console.log(`   Usuario ID: ${usuarioId}`);
    console.log(`   Token: ${token ? 'Generado' : 'No generado'}`);
    
    if (!token) {
      throw new Error('No se pudo obtener el token');
    }
    
    // PASO 3: Ver productos disponibles
    console.log('\n📦 3. Consultando productos...');
    const productos = await axios.get('http://localhost:3002/api/productos');
    console.log(`✅ ${productos.data.productos.length} productos disponibles`);
    
    const producto = productos.data.productos[0];
    console.log(`   Producto seleccionado: ${producto.nombre} - $${producto.precio}`);
    
    // PASO 4: Limpiar carrito
    console.log('\n🧹 4. Limpiando carrito...');
    try {
      await axios.delete('http://localhost:3003/api/carrito/limpiar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Carrito limpiado');
    } catch (error) {
      console.log('ℹ️ Carrito ya estaba vacío');
    }
    
    // PASO 5: Ver carrito vacío
    console.log('\n🛒 5. Verificando carrito vacío...');
    const carritoVacio = await axios.get('http://localhost:3003/api/carrito', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Carrito consultado:', carritoVacio.data);
    
    // PASO 6: Agregar producto al carrito
    console.log('\n➕ 6. Agregando producto al carrito...');
    const agregarProducto = await axios.post('http://localhost:3003/api/carrito', {
      id_producto: producto.id.toString(),
      cantidad: 2,
      talla: 'M',
      color: 'Azul'
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Producto agregado:', agregarProducto.data);
    
    // PASO 7: Ver carrito con productos
    console.log('\n🛒 7. Verificando carrito con productos...');
    const carritoConProductos = await axios.get('http://localhost:3003/api/carrito', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Carrito actualizado:', carritoConProductos.data);
    
    // PASO 8: Calcular total
    const total = carritoConProductos.data.items?.reduce((sum, item) => 
      sum + (item.precio * item.cantidad), 0) || 0;
    console.log(`💰 Total a pagar: $${total}`);
    
    // PASO 9: Checkout
    console.log('\n💳 8. Procesando checkout...');
    const checkout = await axios.post('http://localhost:3003/api/checkout', {
      metodo_pago: 'tarjeta_credito',
      direccion_envio: {
        direccion: 'Calle 123 #45-67',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        codigo_postal: '110111'
      },
      datos_pago: {
        numero_tarjeta: '4111111111111111',
        mes_expiracion: '12',
        año_expiracion: '2025',
        cvv: '123',
        nombre_titular: 'Demo Usuario'
      }
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Pedido creado exitosamente!');
    console.log(`   Número de pedido: ${checkout.data.numero_pedido || checkout.data.id}`);
    console.log(`   Estado: ${checkout.data.estado || 'Procesando'}`);
    console.log(`   Total: $${checkout.data.total || total}`);
    
    // PASO 10: Verificar carrito después del checkout
    console.log('\n🛒 9. Verificando carrito después del checkout...');
    const carritoFinal = await axios.get('http://localhost:3003/api/carrito', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Carrito final:', carritoFinal.data);
    
    console.log('\n🎉 ¡COMPRA COMPLETADA EXITOSAMENTE!');
    console.log('─'.repeat(50));
    console.log('📊 RESUMEN:');
    console.log(`   👤 Usuario: demo@estilomoda.com`);
    console.log(`   🛍️ Producto: ${producto.nombre}`);
    console.log(`   📦 Cantidad: 2 unidades`);
    console.log(`   💰 Total: $${total}`);
    console.log(`   🆔 Pedido: ${checkout.data.numero_pedido || checkout.data.id}`);
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA COMPRA:');
    console.error(`📍 URL: ${error.config?.url || 'Desconocido'}`);
    console.error(`📊 Status: ${error.response?.status || 'Sin respuesta'}`);
    console.error(`💬 Error: ${error.response?.data?.error || error.message}`);
    
    if (error.response?.data) {
      console.error('📋 Detalles:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Diagnóstico
    if (error.message.includes('ECONNREFUSED')) {
      console.error('🔌 DIAGNÓSTICO: Servicio no disponible');
    } else if (error.response?.status === 401) {
      console.error('🔐 DIAGNÓSTICO: Problema de autenticación');
    } else if (error.response?.status === 400) {
      console.error('📝 DIAGNÓSTICO: Datos inválidos en la solicitud');
    }
  }
}

testCompraCompleta();