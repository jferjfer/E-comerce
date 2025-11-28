const { MongoClient } = require('mongodb');

// Configuración MongoDB (misma del catalog-service)
const mongoUri = 'mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority';

// 20 productos variados con imágenes reales
const productos = [
  {
    id: "1", nombre: "Vestido Elegante Negro", precio: 89.99,
    categoria: "Vestidos", descripcion: "Vestido elegante perfecto para ocasiones especiales. Confeccionado en tela premium.",
    imagen: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L", "XL"], colores: ["Negro", "Azul marino"],
    calificacion: 5, en_stock: true, es_eco: true, compatibilidad: 98, stock: 25
  },
  {
    id: "2", nombre: "Camisa Casual Blanca", precio: 47.90,
    categoria: "Camisas", descripcion: "Camisa cómoda de algodón, ideal para el día a día. Diseño versátil y fresco.",
    imagen: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Blanco", "Beige", "Azul claro"],
    calificacion: 4, en_stock: true, es_eco: true, compatibilidad: 95, stock: 18
  },
  {
    id: "3", nombre: "Jeans Clásicos Azules", precio: 79.90,
    categoria: "Pantalones", descripcion: "Jeans de denim de alta calidad. Corte moderno y cómodo para uso diario.",
    imagen: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop",
    tallas: ["28", "30", "32", "34", "36"], colores: ["Azul", "Negro", "Gris"],
    calificacion: 5, en_stock: true, es_eco: false, compatibilidad: 92, stock: 12
  },
  {
    id: "4", nombre: "Blazer Profesional", precio: 129.90,
    categoria: "Blazers", descripcion: "Blazer premium para look profesional. Perfecto para oficina y reuniones importantes.",
    imagen: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Negro", "Gris oscuro", "Azul marino"],
    calificacion: 5, en_stock: true, compatibilidad: 96, stock: 15
  },
  {
    id: "5", nombre: "Vestido Floral Primavera", precio: 65.50,
    categoria: "Vestidos", descripcion: "Vestido con estampado floral, perfecto para primavera. Tela ligera y cómoda.",
    imagen: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L"], colores: ["Rosa", "Amarillo", "Verde"],
    calificacion: 4, en_stock: true, es_eco: true, compatibilidad: 89, stock: 20
  },
  {
    id: "6", nombre: "Suéter Tejido Gris", precio: 55.00,
    categoria: "Suéteres", descripcion: "Suéter de lana suave, ideal para clima frío. Diseño minimalista y elegante.",
    imagen: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Gris", "Beige", "Negro"],
    calificacion: 4, en_stock: true, es_eco: true, compatibilidad: 91, stock: 14
  },
  {
    id: "7", nombre: "Falda Midi Plisada", precio: 42.75,
    categoria: "Faldas", descripcion: "Falda midi con pliegues elegantes. Perfecta para looks formales y casuales.",
    imagen: "https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L", "XL"], colores: ["Negro", "Azul", "Burdeos"],
    calificacion: 4, en_stock: true, compatibilidad: 87, stock: 22
  },
  {
    id: "8", nombre: "Chaqueta de Cuero", precio: 189.99,
    categoria: "Chaquetas", descripcion: "Chaqueta de cuero genuino. Estilo rockero con acabados premium.",
    imagen: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Negro", "Marrón"],
    calificacion: 5, en_stock: true, compatibilidad: 94, stock: 8
  },
  {
    id: "9", nombre: "Blusa Seda Estampada", precio: 73.20,
    categoria: "Blusas", descripcion: "Blusa de seda con estampado único. Elegancia y sofisticación en una prenda.",
    imagen: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L"], colores: ["Multicolor", "Azul", "Rosa"],
    calificacion: 4, en_stock: true, es_eco: false, compatibilidad: 93, stock: 16
  },
  {
    id: "10", nombre: "Pantalón Deportivo", precio: 38.90,
    categoria: "Deportivo", descripcion: "Pantalón cómodo para ejercicio y uso casual. Material transpirable y flexible.",
    imagen: "https://images.unsplash.com/photo-1506629905607-d405b7a82d42?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL", "XXL"], colores: ["Negro", "Gris", "Azul marino"],
    calificacion: 4, en_stock: true, es_eco: true, compatibilidad: 85, stock: 30
  },
  {
    id: "11", nombre: "Vestido Cóctel Rojo", precio: 95.00,
    categoria: "Vestidos", descripcion: "Vestido de cóctel en rojo vibrante. Perfecto para eventos nocturnos especiales.",
    imagen: "https://images.unsplash.com/photo-1566479179817-c0ae8e4b4b3d?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L"], colores: ["Rojo", "Negro", "Azul"],
    calificacion: 5, en_stock: true, compatibilidad: 97, stock: 10
  },
  {
    id: "12", nombre: "Camisa Denim Clásica", precio: 52.40,
    categoria: "Camisas", descripcion: "Camisa de denim atemporal. Versátil para múltiples ocasiones y estilos.",
    imagen: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Azul denim", "Negro", "Blanco"],
    calificacion: 4, en_stock: true, es_eco: false, compatibilidad: 88, stock: 19
  },
  {
    id: "13", nombre: "Abrigo Largo Camel", precio: 156.80,
    categoria: "Abrigos", descripcion: "Abrigo largo en tono camel. Elegancia y calidez para la temporada fría.",
    imagen: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Camel", "Negro", "Gris"],
    calificacion: 5, en_stock: true, compatibilidad: 95, stock: 7
  },
  {
    id: "14", nombre: "Top Crop Moderno", precio: 29.99,
    categoria: "Tops", descripcion: "Top crop con diseño moderno. Ideal para looks juveniles y frescos.",
    imagen: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L"], colores: ["Blanco", "Negro", "Rosa"],
    calificacion: 4, en_stock: true, es_eco: true, compatibilidad: 82, stock: 25
  },
  {
    id: "15", nombre: "Pantalón Palazzo Elegante", precio: 67.30,
    categoria: "Pantalones", descripcion: "Pantalón palazzo de corte elegante. Comodidad y estilo en una sola prenda.",
    imagen: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Negro", "Azul marino", "Beige"],
    calificacion: 4, en_stock: true, compatibilidad: 90, stock: 13
  },
  {
    id: "16", nombre: "Cardigan Oversize", precio: 61.75,
    categoria: "Cardigans", descripcion: "Cardigan oversize súper cómodo. Perfecto para looks relajados y acogedores.",
    imagen: "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L", "XL"], colores: ["Beige", "Gris", "Rosa palo"],
    calificacion: 4, en_stock: true, es_eco: true, compatibilidad: 86, stock: 17
  },
  {
    id: "17", nombre: "Mono Jumpsuit Negro", precio: 84.50,
    categoria: "Monos", descripcion: "Mono jumpsuit elegante en negro. Una pieza versátil para múltiples ocasiones.",
    imagen: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L"], colores: ["Negro", "Azul marino", "Verde"],
    calificacion: 5, en_stock: true, compatibilidad: 93, stock: 11
  },
  {
    id: "18", nombre: "Shorts Denim Vintage", precio: 35.60,
    categoria: "Shorts", descripcion: "Shorts de denim con estilo vintage. Perfectos para looks casuales de verano.",
    imagen: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L", "XL"], colores: ["Azul denim", "Negro", "Blanco"],
    calificacion: 4, en_stock: true, es_eco: false, compatibilidad: 84, stock: 23
  },
  {
    id: "19", nombre: "Kimono Floral Boho", precio: 49.90,
    categoria: "Kimonos", descripcion: "Kimono con estampado floral estilo boho. Perfecto como tercera pieza elegante.",
    imagen: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=500&fit=crop",
    tallas: ["S", "M", "L"], colores: ["Multicolor", "Rosa", "Azul"],
    calificacion: 4, en_stock: true, es_eco: true, compatibilidad: 88, stock: 15
  },
  {
    id: "20", nombre: "Vestido Maxi Bohemio", precio: 78.25,
    categoria: "Vestidos", descripcion: "Vestido maxi con estilo bohemio. Ideal para ocasiones especiales y vacaciones.",
    imagen: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop",
    tallas: ["XS", "S", "M", "L", "XL"], colores: ["Multicolor", "Azul", "Verde"],
    calificacion: 5, en_stock: true, es_eco: true, compatibilidad: 91, stock: 12
  }
];

async function agregarProductos() {
  let client;
  
  try {
    console.log('🔗 Conectando a MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db('ecomerce');
    const collection = db.collection('productos');
    
    console.log('🗑️ Limpiando productos existentes...');
    await collection.deleteMany({});
    
    console.log('📦 Insertando 20 productos variados...');
    
    const resultado = await collection.insertMany(productos);
    
    console.log(`✅ ${resultado.insertedCount} productos insertados exitosamente`);
    
    // Verificar inserción
    const count = await collection.countDocuments();
    console.log(`📊 Total productos en BD: ${count}`);
    
    // Mostrar algunos productos insertados
    const muestraProductos = await collection.find({}).limit(3).toArray();
    console.log('\n🛍️ Muestra de productos insertados:');
    muestraProductos.forEach(p => {
      console.log(`   • ${p.nombre} - $${p.precio} (${p.categoria})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
    console.log('🔚 Conexión cerrada');
  }
}

agregarProductos();