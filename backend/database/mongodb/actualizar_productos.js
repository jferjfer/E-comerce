// ====================================================
// ACTUALIZACIÓN COLECCIÓN PRODUCTOS - CAMPOS COMPLETOS
// ====================================================

use('catalogo_db');

// Eliminar colección existente si existe
db.productos.drop();

// Crear nueva colección con esquema completo
db.createCollection("productos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "precio", "descripcion", "imagen"],
      properties: {
        _id: { bsonType: "objectId" },
        
        // Información básica (OBLIGATORIOS)
        nombre: { bsonType: "string", description: "Nombre del producto" },
        precio: { bsonType: "number", minimum: 0, description: "Precio en centavos" },
        descripcion: { bsonType: "string", description: "Descripción detallada" },
        imagen: { bsonType: "string", description: "URL de imagen principal" },
        
        // Identificación y organización
        sku: { bsonType: "string", description: "Código único del producto" },
        categoria: { bsonType: "string", description: "Categoría del producto" },
        marca: { bsonType: "string", description: "Marca del producto" },
        
        // Variantes del producto
        tallas: { 
          bsonType: "array", 
          items: { bsonType: "string" },
          description: "Tallas disponibles: XS, S, M, L, XL, XXL"
        },
        colores: { 
          bsonType: "array", 
          items: { bsonType: "string" },
          description: "Colores disponibles"
        },
        
        // Stock y precios
        stock_cantidad: { bsonType: "number", minimum: 0, description: "Cantidad en inventario" },
        descuento: { bsonType: "number", minimum: 0, maximum: 100, description: "Porcentaje de descuento" },
        
        // Características físicas
        material: { bsonType: "string", description: "Material principal" },
        
        // Metadatos
        tags: { 
          bsonType: "array", 
          items: { bsonType: "string" },
          description: "Etiquetas para búsqueda"
        },
        calificacion: { bsonType: "number", minimum: 0, maximum: 5, description: "Calificación promedio" },
        
        // Estados
        en_stock: { bsonType: "bool", description: "Disponibilidad" },
        activo: { bsonType: "bool", description: "Producto activo/inactivo" },
        es_eco: { bsonType: "bool", description: "Producto ecológico" },
        
        // Fechas
        fecha_creacion: { bsonType: "date", description: "Fecha de creación" },
        fecha_actualizacion: { bsonType: "date", description: "Última actualización" },
        
        // Compatibilidad (para IA)
        compatibilidad: { bsonType: "number", minimum: 0, maximum: 100, description: "Puntuación de compatibilidad" },
        
        // Referencias externas
        id_tendencia_moda: { bsonType: "string", description: "ID de tendencia asociada" },
        referencia_inventario: { bsonType: "string", description: "Referencia en sistema de inventario" }
      }
    }
  }
});

// Crear índices optimizados
db.productos.createIndex({ nombre: "text", descripcion: "text", tags: "text" });
db.productos.createIndex({ precio: 1 });
db.productos.createIndex({ categoria: 1 });
db.productos.createIndex({ marca: 1 });
db.productos.createIndex({ sku: 1 }, { unique: true, sparse: true });
db.productos.createIndex({ en_stock: 1 });
db.productos.createIndex({ activo: 1 });
db.productos.createIndex({ calificacion: -1 });
db.productos.createIndex({ fecha_creacion: -1 });
db.productos.createIndex({ descuento: -1 });

// Insertar productos de ejemplo con el nuevo esquema
db.productos.insertMany([
  {
    nombre: "Vestido Elegante de Verano",
    precio: 8999900, // $89,999 en centavos
    descripcion: "Hermoso vestido de verano confeccionado en algodón premium. Perfecto para ocasiones especiales y uso diario. Diseño moderno con corte favorecedor.",
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
    precio: 12999900, // $129,999 en centavos
    descripcion: "Blazer de corte moderno ideal para el ambiente profesional. Confeccionado en mezcla de lana de alta calidad con forro interior suave.",
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
  },
  {
    nombre: "Pantalón Casual Comfort",
    precio: 6999900, // $69,999 en centavos
    descripcion: "Pantalón de corte relajado perfecto para el día a día. Tela suave y transpirable que se adapta a cualquier ocasión casual.",
    imagen: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop",
    sku: "PAN-CAS-001",
    categoria: "Pantalones",
    marca: "Estilo y Moda",
    tallas: ["XS", "S", "M", "L", "XL"],
    colores: ["Negro", "Beige", "Gris"],
    stock_cantidad: 75,
    descuento: 25,

    material: "Algodón 95%, Elastano 5%",
    tags: ["casual", "cómodo", "diario", "algodón"],
    calificacion: 4.6,
    en_stock: true,
    activo: true,
    es_eco: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
    compatibilidad: 88
  },
  {
    nombre: "Camisa Premium Oficina",
    precio: 7999900, // $79,999 en centavos
    descripcion: "Camisa de corte clásico en algodón premium. Ideal para el ambiente de oficina con un toque de elegancia y comodidad.",
    imagen: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop",
    sku: "CAM-PRE-001",
    categoria: "Camisas",
    marca: "Estilo y Moda",
    tallas: ["S", "M", "L", "XL"],
    colores: ["Blanco", "Azul", "Rosa"],
    stock_cantidad: 60,
    descuento: 10,

    material: "Algodón 100%",
    tags: ["oficina", "premium", "clásico", "algodón"],
    calificacion: 4.7,
    en_stock: true,
    activo: true,
    es_eco: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
    compatibilidad: 90
  }
]);

print("✅ Colección 'productos' actualizada con esquema completo");
print("📦 Productos de ejemplo insertados: " + db.productos.countDocuments());
print("🔍 Índices creados para optimizar consultas");