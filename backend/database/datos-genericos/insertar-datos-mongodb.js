// Insertar datos genéricos en MongoDB
// Ejecutar con: mongosh --eval "load('insertar-datos-mongodb.js')"

// CATALOG SERVICE - Productos y categorías
use('catalogo_db');

// Categorías de ropa
db.categorias.insertMany([
  {
    _id: 'cat_001',
    nombre: 'Mujer',
    descripcion: 'Moda femenina para todas las ocasiones',
    imagen_url: 'https://ejemplo.com/categorias/mujer.jpg',
    categoria_padre: null,
    nivel: 1,
    orden: 1,
    activa: true,
    metadatos: {
      seo_titulo: 'Ropa de Mujer - Moda Femenina',
      seo_descripcion: 'Descubre la última moda femenina con los mejores precios'
    }
  },
  {
    _id: 'cat_002',
    nombre: 'Hombre',
    descripcion: 'Moda masculina moderna y elegante',
    imagen_url: 'https://ejemplo.com/categorias/hombre.jpg',
    categoria_padre: null,
    nivel: 1,
    orden: 2,
    activa: true
  },
  {
    _id: 'cat_003',
    nombre: 'Vestidos',
    descripcion: 'Vestidos elegantes y casuales',
    imagen_url: 'https://ejemplo.com/categorias/vestidos.jpg',
    categoria_padre: 'cat_001',
    nivel: 2,
    orden: 1,
    activa: true
  },
  {
    _id: 'cat_004',
    nombre: 'Camisetas',
    descripcion: 'Camisetas básicas y estampadas',
    imagen_url: 'https://ejemplo.com/categorias/camisetas.jpg',
    categoria_padre: 'cat_002',
    nivel: 2,
    orden: 1,
    activa: true
  },
  {
    _id: 'cat_005',
    nombre: 'Pantalones',
    descripcion: 'Pantalones para hombre y mujer',
    imagen_url: 'https://ejemplo.com/categorias/pantalones.jpg',
    categoria_padre: null,
    nivel: 1,
    orden: 3,
    activa: true
  }
]);

// Productos de ropa
db.productos.insertMany([
  {
    _id: 'prod_001',
    nombre: 'Vestido Floral Primavera',
    descripcion: 'Vestido midi con estampado floral, perfecto para primavera',
    descripcion_larga: 'Hermoso vestido midi con estampado floral en tonos pastel. Confeccionado en tela ligera y fresca, ideal para ocasiones especiales o uso diario.',
    precio: 89.99,
    precio_oferta: 69.99,
    categoria_id: 'cat_003',
    marca: 'FloralChic',
    sku: 'VEST001M',
    codigo_barras: '123456789001',
    imagenes: [
      'https://ejemplo.com/productos/vestido-floral-1.jpg',
      'https://ejemplo.com/productos/vestido-floral-2.jpg'
    ],
    especificaciones: {
      material: '95% Poliéster, 5% Elastano',
      talla: 'M',
      color: 'Floral Rosa',
      largo: 'Midi'
    },
    variantes: [
      { nombre: 'Talla', opciones: ['XS', 'S', 'M', 'L', 'XL'] },
      { nombre: 'Color', opciones: ['Floral Rosa', 'Floral Azul', 'Floral Amarillo'] }
    ],
    tendencia_moda: 'romantica',
    activo: true,
    destacado: true,
    puntuacion_promedio: 4.7,
    total_resenas: 89
  },
  {
    _id: 'prod_002',
    nombre: 'Camiseta Básica Premium',
    descripcion: 'Camiseta 100% algodón orgánico, corte moderno',
    descripcion_larga: 'Camiseta básica de alta calidad confeccionada en algodón orgánico. Corte moderno que se adapta perfectamente al cuerpo.',
    precio: 24.99,
    precio_oferta: null,
    categoria_id: 'cat_004',
    marca: 'EssentialWear',
    sku: 'CAM001M',
    codigo_barras: '123456789002',
    imagenes: [
      'https://ejemplo.com/productos/camiseta-basica-1.jpg',
      'https://ejemplo.com/productos/camiseta-basica-2.jpg'
    ],
    especificaciones: {
      material: '100% Algodón Orgánico',
      talla: 'M',
      color: 'Blanco',
      corte: 'Regular Fit'
    },
    variantes: [
      { nombre: 'Talla', opciones: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { nombre: 'Color', opciones: ['Blanco', 'Negro', 'Gris', 'Azul Marino', 'Verde Oliva'] }
    ],
    tendencia_moda: 'clasica',
    activo: true,
    destacado: false,
    puntuacion_promedio: 4.5,
    total_resenas: 156
  },
  {
    _id: 'prod_003',
    nombre: 'Jeans Skinny Mujer',
    descripcion: 'Jeans de corte skinny con elastano para mayor comodidad',
    descripcion_larga: 'Jeans skinny de tiro medio con tecnología stretch que proporciona comodidad y libertad de movimiento.',
    precio: 79.99,
    precio_oferta: 59.99,
    categoria_id: 'cat_005',
    marca: 'DenimStyle',
    sku: 'JEAN001M',
    codigo_barras: '123456789003',
    imagenes: [
      'https://ejemplo.com/productos/jeans-skinny-1.jpg',
      'https://ejemplo.com/productos/jeans-skinny-2.jpg'
    ],
    especificaciones: {
      material: '98% Algodón, 2% Elastano',
      talla: 'M (30)',
      color: 'Azul Oscuro',
      corte: 'Skinny'
    },
    variantes: [
      { nombre: 'Talla', opciones: ['26', '28', '30', '32', '34', '36'] },
      { nombre: 'Color', opciones: ['Azul Oscuro', 'Azul Claro', 'Negro', 'Gris'] }
    ],
    tendencia_moda: 'urbana',
    activo: true,
    destacado: true,
    puntuacion_promedio: 4.4,
    total_resenas: 203
  }
]);

// SOCIAL SERVICE - Reseñas, preguntas y listas de deseos
use('social_db');

// Reseñas
db.resenas.insertMany([
  {
    _id: ObjectId(),
    producto_id: 'prod_001',
    usuario_id: 2,
    puntuacion: 5,
    titulo: 'Excelente teléfono',
    comentario: 'La calidad de la cámara es impresionante y la batería dura todo el día. Muy recomendado.',
    verificada: true,
    util_positivos: 12,
    util_negativos: 1,
    fecha_creacion: new Date('2024-01-10'),
    respuesta_vendedor: null
  },
  {
    _id: ObjectId(),
    producto_id: 'prod_001',
    usuario_id: 3,
    puntuacion: 4,
    titulo: 'Muy bueno pero caro',
    comentario: 'Es un gran teléfono con excelente rendimiento, pero el precio es bastante alto.',
    verificada: true,
    util_positivos: 8,
    util_negativos: 2,
    fecha_creacion: new Date('2024-01-12')
  },
  {
    _id: ObjectId(),
    producto_id: 'prod_003',
    usuario_id: 4,
    puntuacion: 4,
    titulo: 'Buena calidad-precio',
    comentario: 'Camiseta de buena calidad, el algodón es suave y la talla es correcta.',
    verificada: true,
    util_positivos: 15,
    util_negativos: 0,
    fecha_creacion: new Date('2024-01-08')
  }
]);

// Preguntas
db.preguntas.insertMany([
  {
    _id: ObjectId(),
    producto_id: 'prod_001',
    usuario_id: 5,
    pregunta: '¿Incluye cargador en la caja?',
    respuesta: 'Sí, incluye cable USB-C a USB-C y adaptador de corriente.',
    respondida_por: 1,
    fecha_pregunta: new Date('2024-01-05'),
    fecha_respuesta: new Date('2024-01-05'),
    util_positivos: 5,
    util_negativos: 0
  },
  {
    _id: ObjectId(),
    producto_id: 'prod_002',
    usuario_id: 2,
    pregunta: '¿Cuánto tiempo dura la batería?',
    respuesta: 'Con uso normal, la batería dura aproximadamente 24 horas.',
    respondida_por: 1,
    fecha_pregunta: new Date('2024-01-07'),
    fecha_respuesta: new Date('2024-01-07'),
    util_positivos: 3,
    util_negativos: 0
  }
]);

// Listas de deseos
db.listas_deseos.insertMany([
  {
    _id: ObjectId(),
    usuario_id: 2,
    nombre: 'Mi Lista Principal',
    descripcion: 'Productos que me interesan',
    productos: ['prod_002', 'prod_003'],
    publica: false,
    fecha_creacion: new Date('2024-01-01')
  },
  {
    _id: ObjectId(),
    usuario_id: 3,
    nombre: 'Tecnología',
    descripcion: 'Gadgets y electrónicos',
    productos: ['prod_001'],
    publica: true,
    fecha_creacion: new Date('2024-01-03')
  }
]);

// AI SERVICE - Recomendaciones y análisis de estilo
use('ai_db');

// Recomendaciones
db.recomendaciones.insertMany([
  {
    _id: ObjectId(),
    usuario_id: 2,
    tipo: 'productos_similares',
    productos_recomendados: [
      {
        producto_id: 'prod_002',
        puntuacion: 0.85,
        razon: 'Smartphone similar en rango de precio'
      },
      {
        producto_id: 'prod_003',
        puntuacion: 0.45,
        razon: 'Producto frecuentemente comprado junto'
      }
    ],
    fecha_generacion: new Date('2024-01-15'),
    activa: true
  },
  {
    _id: ObjectId(),
    usuario_id: 3,
    tipo: 'basado_en_historial',
    productos_recomendados: [
      {
        producto_id: 'prod_001',
        puntuacion: 0.92,
        razon: 'Basado en compras anteriores de electrónicos'
      }
    ],
    fecha_generacion: new Date('2024-01-14'),
    activa: true
  }
]);

// Análisis de estilo
db.analisis_estilo.insertMany([
  {
    _id: ObjectId(),
    usuario_id: 2,
    estilo_detectado: 'romantico_casual',
    colores_preferidos: ['rosa', 'blanco', 'beige'],
    marcas_preferidas: ['FloralChic', 'EssentialWear'],
    categoria_principal: 'Mujer',
    confianza: 0.78,
    fecha_analisis: new Date('2024-01-10'),
    productos_sugeridos: ['prod_001', 'prod_002']
  },
  {
    _id: ObjectId(),
    usuario_id: 3,
    estilo_detectado: 'urbano_moderno',
    colores_preferidos: ['negro', 'gris', 'azul marino'],
    marcas_preferidas: ['DenimStyle', 'EssentialWear'],
    categoria_principal: 'Hombre',
    confianza: 0.85,
    fecha_analisis: new Date('2024-01-12'),
    productos_sugeridos: ['prod_003', 'prod_002']
  }
]);

print('✅ Datos genéricos insertados correctamente en MongoDB');