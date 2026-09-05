// ====================================================
// 2. BASE DE DATOS SERVICIO CATÁLOGO (MongoDB)
// ====================================================

use('bd_catalogo');

// Colección: productos
db.createCollection("productos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "precio"],
      properties: {
        _id: { bsonType: "objectId" },
        nombre: { bsonType: "string" },
        talla: { bsonType: "string" },
        color: { bsonType: "string" },
        precio: { bsonType: "decimal" },
        imagen: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        atributos: { bsonType: "object" },
        ids_categoria: { bsonType: "array" },
        id_tendencia_moda: { bsonType: "string" },
        referencia_inventario: { bsonType: "string" },
        activo: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: categorias
db.createCollection("categorias", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre"],
      properties: {
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        id_categoria_padre: { bsonType: "string" },
        nivel: { bsonType: "int" },
        imagen: { bsonType: "string" },
        activo: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: tendencias_moda
db.createCollection("tendencias_moda", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre"],
      properties: {
        nombre: { bsonType: "string", enum: ["Clasica", "Urbana", "Deportiva", "Elegante"] },
        descripcion: { bsonType: "string" },
        atributos_asociados: { bsonType: "object" },
        temporada: { bsonType: "string" },
        activo: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Índices para optimizar consultas
db.productos.createIndex({ nombre: "text", descripcion: "text" });
db.productos.createIndex({ precio: 1 });
db.productos.createIndex({ ids_categoria: 1 });
db.productos.createIndex({ id_tendencia_moda: 1 });
db.categorias.createIndex({ nombre: 1 });
db.categorias.createIndex({ id_categoria_padre: 1 });
db.tendencias_moda.createIndex({ nombre: 1 });

// Datos iniciales de ejemplo
db.tendencias_moda.insertMany([
  {
    nombre: "Clasica",
    descripcion: "Estilo atemporal y elegante",
    atributos_asociados: { colores: ["Negro", "Blanco", "Gris", "Azul Marino"], cortes: ["Recto", "Ajustado"] },
    activo: true,
    fecha_creacion: new Date()
  },
  {
    nombre: "Urbana",
    descripcion: "Estilo moderno y casual",
    atributos_asociados: { colores: ["Negro", "Gris", "Verde Militar"], cortes: ["Oversize", "Relajado"] },
    activo: true,
    fecha_creacion: new Date()
  }
]);
