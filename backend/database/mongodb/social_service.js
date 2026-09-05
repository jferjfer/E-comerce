// ====================================================
// 5. BASE DE DATOS SERVICIO SOCIAL (MongoDB)
// ====================================================

use('bd_social');

// Colección: resenas
db.createCollection("resenas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_producto", "id_usuario", "calificacion"],
      properties: {
        id_producto: { bsonType: "string" },
        id_usuario: { bsonType: "string" },
        calificacion: { bsonType: "int", minimum: 1, maximum: 5 },
        comentario: { bsonType: "string" },
        utilidad: { bsonType: "int" },
        imagenes: { bsonType: "array" },
        verificado: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: preguntas
db.createCollection("preguntas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_producto", "id_usuario", "texto_pregunta"],
      properties: {
        id_producto: { bsonType: "string" },
        id_usuario: { bsonType: "string" },
        texto_pregunta: { bsonType: "string" },
        estado: { bsonType: "string", enum: ["Pendiente", "Respondida"] },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: respuestas
db.createCollection("respuestas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_pregunta", "texto_respuesta"],
      properties: {
        id_pregunta: { bsonType: "string" },
        id_usuario: { bsonType: "string" },
        texto_respuesta: { bsonType: "string" },
        es_vendedor: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: listas_deseos
db.createCollection("listas_deseos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_usuario", "productos"],
      properties: {
        id_usuario: { bsonType: "string" },
        nombre: { bsonType: "string" },
        productos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              id_producto: { bsonType: "string" },
              fecha_agregado: { bsonType: "date" }
            }
          }
        },
        publica: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Índices para optimizar consultas
db.resenas.createIndex({ id_producto: 1 });
db.resenas.createIndex({ id_usuario: 1 });
db.resenas.createIndex({ calificacion: -1 });
db.resenas.createIndex({ utilidad: -1 });
db.preguntas.createIndex({ id_producto: 1 });
db.preguntas.createIndex({ id_usuario: 1 });
db.preguntas.createIndex({ estado: 1 });
db.respuestas.createIndex({ id_pregunta: 1 });
db.listas_deseos.createIndex({ id_usuario: 1 });
