const axios = require('axios');

async function probarCrearProducto() {
  console.log('🧪 Probando flujo de crear producto...\n');

  const producto = {
    nombre: "Vestido de Prueba Automática",
    precio: 9999900, // $99,999 en centavos
    descripcion: "Este es un producto creado automáticamente para probar el flujo completo del sistema.",
    imagen: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
    sku: "TEST-001",
    categoria: "Vestidos",
    marca: "Estilo y Moda Test",
    tallas: ["S", "M", "L"],
    colores: ["Azul", "Rosa"],
    stock_cantidad: 25,
    descuento: 10,
    material: "Algodón Premium",
    tags: ["test", "automatico", "prueba"],
    calificacion: 5,
    en_stock: true,
    activo: true,
    es_eco: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
    compatibilidad: 98
  };

  try {
    console.log('📦 Enviando producto al backend...');
    console.log('🔗 URL:', 'http://localhost:3000/api/productos');
    console.log('📋 Datos:', JSON.stringify(producto, null, 2));

    // Crear producto
    const response = await axios.post('http://localhost:3000/api/productos', producto, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('\n✅ Respuesta del servidor:');
    console.log('📊 Status:', response.status);
    console.log('📄 Data:', JSON.stringify(response.data, null, 2));

    if (response.data.exito) {
      console.log('\n🎉 ¡Producto creado exitosamente!');
      console.log('🆔 ID del producto:', response.data.producto.id);
      
      // Verificar que aparece en la lista
      console.log('\n🔍 Verificando que aparece en la lista...');
      const listResponse = await axios.get('http://localhost:3000/api/productos');
      
      const productoEncontrado = listResponse.data.productos.find(p => 
        p.nombre === producto.nombre
      );
      
      if (productoEncontrado) {
        console.log('✅ Producto encontrado en la lista!');
        console.log('📝 Nombre:', productoEncontrado.nombre);
        console.log('💰 Precio:', productoEncontrado.precio);
        console.log('🏷️ Categoría:', productoEncontrado.categoria);
      } else {
        console.log('❌ Producto NO encontrado en la lista');
      }
      
    } else {
      console.log('❌ Error en la respuesta:', response.data.error);
    }

  } catch (error) {
    console.log('\n❌ Error en la prueba:');
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Data:', error.response.data);
    } else if (error.request) {
      console.log('🌐 Error de conexión - Servidor no responde');
      console.log('🔗 URL intentada:', error.config?.url);
    } else {
      console.log('⚠️ Error:', error.message);
    }
  }
}

// Ejecutar prueba
probarCrearProducto();