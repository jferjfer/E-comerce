const axios = require('axios');

const API = 'http://localhost:3000';

async function crearPedidoCompleto() {
  try {
    console.log('🛍️ FLUJO COMPLETO DE COMPRA - CLIENTE NORMAL\n');
    
    // 1. LOGIN
    console.log('1️⃣ Iniciando sesión como cliente...');
    const login = await axios.post(`${API}/api/auth/login`, {
      email: 'demo@estilomoda.com',
      password: 'admin123'
    });
    
    const token = login.data.token;
    const usuario = login.data.usuario;
    console.log(`✅ Sesión iniciada: ${usuario.nombre} (${usuario.email})`);
    console.log(`   Token: ${token.substring(0, 30)}...\n`);
    
    // 2. VER PRODUCTOS
    console.log('2️⃣ Explorando catálogo de productos...');
    const productos = await axios.get(`${API}/api/productos`);
    console.log(`✅ ${productos.data.productos.length} productos disponibles`);
    
    const producto1 = productos.data.productos[0];
    const producto2 = productos.data.productos[1];
    console.log(`   📦 ${producto1.nombre} - $${producto1.precio}`);
    console.log(`   📦 ${producto2.nombre} - $${producto2.precio}\n`);
    
    // 3. AGREGAR AL CARRITO
    console.log('3️⃣ Agregando productos al carrito...');
    await axios.post(`${API}/api/carrito`, {
      id_producto: producto1.id,
      cantidad: 2
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Agregado: ${producto1.nombre} x2`);
    
    await axios.post(`${API}/api/carrito`, {
      id_producto: producto2.id,
      cantidad: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Agregado: ${producto2.nombre} x1\n`);
    
    // 4. VER CARRITO
    console.log('4️⃣ Revisando carrito...');
    const carrito = await axios.get(`${API}/api/carrito`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const items = carrito.data.datos.productos;
    const total = carrito.data.datos.total;
    
    console.log(`✅ Carrito con ${items.length} productos:`);
    items.forEach(item => {
      console.log(`   • ${item.nombre || 'Producto ' + item.id} x${item.cantidad} - $${item.precio * item.cantidad}`);
    });
    console.log(`   💰 Total: $${total}\n`);
    
    // 5. CHECKOUT
    console.log('5️⃣ Procesando pago...');
    const checkout = await axios.post(`${API}/api/checkout`, {
      metodo_pago: 'tarjeta_credito',
      direccion_envio: {
        nombre: usuario.nombre,
        direccion: 'Calle 123 #45-67',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        codigo_postal: '110111',
        telefono: '3001234567'
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const pedido = checkout.data.orden;
    console.log(`✅ ¡PEDIDO CREADO EXITOSAMENTE!`);
    console.log(`   📋 ID Pedido: ${pedido.id}`);
    console.log(`   💳 Método de pago: ${pedido.metodo_pago}`);
    console.log(`   💰 Total pagado: $${pedido.total}`);
    console.log(`   📦 Estado: ${pedido.estado}`);
    console.log(`   📅 Fecha: ${new Date(pedido.fecha_creacion).toLocaleString()}\n`);
    
    // 6. VERIFICAR CARRITO VACÍO
    console.log('6️⃣ Verificando carrito después del checkout...');
    const carritoFinal = await axios.get(`${API}/api/carrito`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Carrito vacío: ${carritoFinal.data.datos.productos.length} productos\n`);
    
    console.log('🎉 ¡COMPRA COMPLETADA CON ÉXITO!');
    console.log('═══════════════════════════════════════');
    console.log(`Cliente: ${usuario.nombre}`);
    console.log(`Pedido: #${pedido.id}`);
    console.log(`Total: $${pedido.total}`);
    console.log(`Estado: ${pedido.estado}`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

crearPedidoCompleto();
