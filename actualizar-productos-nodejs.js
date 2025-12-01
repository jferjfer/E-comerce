const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://Vercel-Admin-catalogo:92HI0xaJVpfpogCL@catalogo.eocsgaj.mongodb.net/catalogo_db";

async function actualizarProductos() {
  console.log('🔄 Conectando a MongoDB Atlas...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas');
    
    const db = client.db('catalogo_db');
    
    // Eliminar colección existente
    try {
      await db.collection('productos').drop();
      console.log('🗑️ Colección productos eliminada');
    } catch (e) {
      console.log('ℹ️ Colección productos no existía');
    }
    
    // Crear nueva colección con validación
    await db.createCollection('productos', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["nombre", "precio", "descripcion", "imagen"],
          properties: {
            nombre: { bsonType: "string" },
            precio: { bsonType: "number", minimum: 0 },
            descripcion: { bsonType: "string" },
            imagen: { bsonType: "string" },
            sku: { bsonType: "string" },
            categoria: { bsonType: "string" },
            marca: { bsonType: "string" },
            tallas: { bsonType: "array", items: { bsonType: "string" } },
            colores: { bsonType: "array", items: { bsonType: "string" } },
            stock_cantidad: { bsonType: "number", minimum: 0 },
            descuento: { bsonType: "number", minimum: 0, maximum: 100 },
            material: { bsonType: "string" },
            tags: { bsonType: "array", items: { bsonType: "string" } },
            calificacion: { bsonType: "number", minimum: 0, maximum: 5 },
            en_stock: { bsonType: "bool" },
            activo: { bsonType: "bool" },
            es_eco: { bsonType: "bool" },
            fecha_creacion: { bsonType: "date" },
            fecha_actualizacion: { bsonType: "date" },
            compatibilidad: { bsonType: "number", minimum: 0, maximum: 100 }
          }
        }
      }
    });
    
    console.log('📦 Colección productos creada con validación');
    
    // Crear índices
    await db.collection('productos').createIndex({ nombre: "text", descripcion: "text", tags: "text" });
    await db.collection('productos').createIndex({ precio: 1 });
    await db.collection('productos').createIndex({ categoria: 1 });
    await db.collection('productos').createIndex({ sku: 1 }, { unique: true, sparse: true });
    
    console.log('🔍 Índices creados');
    
    // Insertar productos de ejemplo
    const productos = [
      {
        nombre: "Vestido Elegante de Verano",
        precio: 8999900,
        descripcion: "Hermoso vestido de verano confeccionado en algodón premium. Perfecto para ocasiones especiales y uso diario.",
        imagen: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
        sku: "VES-VER-001",
        categoria: "Vestidos",
        marca: "Estilo y Moda",
        tallas: ["S", "M", "L", "XL"],
        colores: ["Azul", "Rosa", "Blanco"],
        stock_cantidad: 50,
        descuento: 15,
        material: "Algodón 100%",
        tags: ["verano", "elegante", "casual", "algodón"],
        calificacion: 4.8,
        en_stock: true,
        activo: true,
        es_eco: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        compatibilidad: 95
      },
      {
        nombre: "Blazer Ejecutivo Premium",
        precio: 12999900,
        descripcion: "Blazer de corte moderno ideal para el ambiente profesional. Confeccionado en mezcla de lana de alta calidad.",
        imagen: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
        sku: "BLA-EJE-001",
        categoria: "Blazers",
        marca: "Estilo y Moda",
        tallas: ["S", "M", "L"],
        colores: ["Negro", "Gris", "Azul Marino"],
        stock_cantidad: 30,
        descuento: 0,
        material: "Lana 70%, Poliéster 30%",
        tags: ["formal", "ejecutivo", "profesional", "lana"],
        calificacion: 4.9,
        en_stock: true,
        activo: true,
        es_eco: false,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        compatibilidad: 92
      }
    ];
    
    await db.collection('productos').insertMany(productos);
    console.log('✅ Productos de ejemplo insertados');
    
    const count = await db.collection('productos').countDocuments();
    console.log(`📊 Total productos en BD: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

actualizarProductos();