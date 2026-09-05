// ====================================================
// 7. BASE DE DATOS SERVICIO INTELIGENCIA ARTIFICIAL (MongoDB)
// ====================================================

use('bd_ia');

// Colección: recomendaciones_ia
db.createCollection("recomendaciones_ia", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_usuario", "productos", "tipo_algoritmo"],
      properties: {
        id_usuario: { bsonType: "string" },
        productos: { 
          bsonType: "array",
          items: { bsonType: "string" }
        },
        motivo: { bsonType: "string" },
        tipo_algoritmo: { 
          bsonType: "string", 
          enum: ["RecomendacionEstilo", "Colaborativo", "Contenido", "Hibrido"] 
        },
        puntuacion_confianza: { bsonType: "decimal" },
        contexto: { bsonType: "object" },
        activa: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" },
        fecha_expiracion: { bsonType: "date" }
      }
    }
  }
});

// Colección: estilos_usuario
db.createCollection("estilos_usuario", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_usuario", "estilo_dominante"],
      properties: {
        id_usuario: { bsonType: "string" },
        estilo_dominante: { 
          bsonType: "string",
          enum: ["Clasica", "Urbana", "Deportiva", "Elegante", "Bohemia", "Minimalista"]
        },
        puntuacion_afinidad: { bsonType: "decimal" },
        estilos_secundarios: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              estilo: { bsonType: "string" },
              puntuacion: { bsonType: "decimal" }
            }
          }
        },
        preferencias: { bsonType: "object" },
        fecha_actualizacion: { bsonType: "date" },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: registros_sesion_ar
db.createCollection("registros_sesion_ar", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_usuario", "duracion_sesion"],
      properties: {
        id_usuario: { bsonType: "string" },
        duracion_sesion: { bsonType: "int" },
        productos_visualizados: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        puntos_interes: { bsonType: "object" },
        accion_final: { 
          bsonType: "string",
          enum: ["guardarOutfit", "agregarCarrito", "compartir", "salir"]
        },
        dispositivo: { bsonType: "string" },
        calidad_seguimiento: { bsonType: "string" },
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: asesores_ia
db.createCollection("asesores_ia", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "tipo_algoritmo"],
      properties: {
        nombre: { bsonType: "string" },
        tipo_algoritmo: { 
          bsonType: "string",
          enum: ["RecomendacionEstilo", "ColorMatching", "TallaOptima", "TendenciaPrediccion"]
        },
        simulacion_visual: { bsonType: "bool" },
        parametros: { bsonType: "object" },
        version: { bsonType: "string" },
        activo: { bsonType: "bool" },
        created_at: { bsonType: "date" }
      }
    }
  }
});

// Índices para optimizar consultas
db.recomendaciones_ia.createIndex({ id_usuario: 1 });
db.recomendaciones_ia.createIndex({ fecha_creacion: -1 });
db.recomendaciones_ia.createIndex({ fecha_expiracion: 1 }, { expireAfterSeconds: 0 });
db.estilos_usuario.createIndex({ id_usuario: 1 }, { unique: true });
db.registros_sesion_ar.createIndex({ id_usuario: 1 });
db.registros_sesion_ar.createIndex({ fecha_creacion: -1 });
db.asesores_ia.createIndex({ tipo_algoritmo: 1 });

// Datos iniciales de ejemplo
db.asesores_ia.insertMany([
  {
    nombre: "Asesor de Estilo Personal",
    tipo_algoritmo: "RecomendacionEstilo",
    simulacion_visual: true,
    parametros: {
      peso_historial: 0.4,
      peso_tendencias: 0.3,
      peso_similitud: 0.3
    },
    version: "1.0",
    activo: true,
    fecha_creacion: new Date()
  },
  {
    nombre: "Predictor de Tendencias",
    tipo_algoritmo: "TendenciaPrediccion",
    simulacion_visual: false,
    parametros: {
      ventana_temporal: 30,
      umbral_confianza: 0.7
    },
    version: "1.0",
    activo: true,
    fecha_creacion: new Date()
  }
]);