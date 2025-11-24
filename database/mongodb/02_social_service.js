// ====================================================
// STYLEHUB SOCIAL SERVICE - RESEÑAS, COMUNIDAD Y SOCIAL COMMERCE
// ====================================================

use('stylehub_social');

// Colección: Reseñas de productos
db.createCollection("resenas_productos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "producto_id", "calificacion", "titulo"],
      properties: {
        usuario_id: { bsonType: "string" },
        producto_id: { bsonType: "string" },
        variante_id: { bsonType: "string" },
        pedido_id: { bsonType: "string" },
        calificacion: { 
          bsonType: "int",
          minimum: 1,
          maximum: 5
        },
        titulo: { bsonType: "string" },
        comentario: { bsonType: "string" },
        
        // Calificaciones específicas
        calificaciones_detalle: {
          bsonType: "object",
          properties: {
            calidad: { bsonType: "int", minimum: 1, maximum: 5 },
            talla: { bsonType: "int", minimum: 1, maximum: 5 },
            comodidad: { bsonType: "int", minimum: 1, maximum: 5 },
            durabilidad: { bsonType: "int", minimum: 1, maximum: 5 },
            relacion_precio_calidad: { bsonType: "int", minimum: 1, maximum: 5 }
          }
        },
        
        // Información adicional
        talla_comprada: { bsonType: "string" },
        ajuste_talla: { 
          bsonType: "string",
          enum: ["muy_pequeña", "pequeña", "perfecta", "grande", "muy_grande"]
        },
        recomendaria: { bsonType: "bool" },
        
        // Multimedia
        imagenes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              url: { bsonType: "string" },
              descripcion: { bsonType: "string" },
              orden: { bsonType: "int" }
            }
          }
        },
        videos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              url: { bsonType: "string" },
              thumbnail: { bsonType: "string" },
              duracion: { bsonType: "int" }
            }
          }
        },
        
        // Interacciones
        likes: { bsonType: "int", minimum: 0 },
        dislikes: { bsonType: "int", minimum: 0 },
        reportes: { bsonType: "int", minimum: 0 },
        respuestas_tienda: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              usuario_respuesta: { bsonType: "string" },
              contenido: { bsonType: "string" },
              fecha_respuesta: { bsonType: "date" },
              es_oficial: { bsonType: "bool" }
            }
          }
        },
        
        // Moderación
        estado: { 
          bsonType: "string",
          enum: ["pendiente", "aprobada", "rechazada", "reportada"]
        },
        moderado_por: { bsonType: "string" },
        fecha_moderacion: { bsonType: "date" },
        motivo_rechazo: { bsonType: "string" },
        
        // Verificación
        compra_verificada: { bsonType: "bool" },
        fecha_compra: { bsonType: "date" },
        
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Preguntas y respuestas sobre productos
db.createCollection("preguntas_productos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "producto_id", "pregunta"],
      properties: {
        usuario_id: { bsonType: "string" },
        producto_id: { bsonType: "string" },
        variante_id: { bsonType: "string" },
        pregunta: { bsonType: "string" },
        categoria_pregunta: { 
          bsonType: "string",
          enum: ["talla", "material", "cuidado", "disponibilidad", "envio", "general"]
        },
        
        respuestas: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["usuario_respuesta", "contenido", "fecha_respuesta"],
            properties: {
              usuario_respuesta: { bsonType: "string" },
              contenido: { bsonType: "string" },
              es_oficial: { bsonType: "bool" },
              es_vendedor: { bsonType: "bool" },
              likes: { bsonType: "int", minimum: 0 },
              fecha_respuesta: { bsonType: "date" },
              verificado: { bsonType: "bool" }
            }
          }
        },
        
        // Estado y moderación
        estado: { 
          bsonType: "string",
          enum: ["activa", "respondida", "cerrada", "reportada"]
        },
        prioridad: { 
          bsonType: "string",
          enum: ["baja", "normal", "alta", "urgente"]
        },
        
        // Interacciones
        vistas: { bsonType: "int", minimum: 0 },
        likes: { bsonType: "int", minimum: 0 },
        
        fecha_creacion: { bsonType: "date" },
        fecha_ultima_respuesta: { bsonType: "date" }
      }
    }
  }
});

// Colección: Listas de deseos
db.createCollection("listas_deseos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "nombre", "productos"],
      properties: {
        usuario_id: { bsonType: "string" },
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        
        productos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["producto_id", "fecha_agregado"],
            properties: {
              producto_id: { bsonType: "string" },
              variante_id: { bsonType: "string" },
              fecha_agregado: { bsonType: "date" },
              notas_personales: { bsonType: "string" },
              prioridad: { 
                bsonType: "string",
                enum: ["baja", "media", "alta"]
              },
              notificar_descuento: { bsonType: "bool" },
              notificar_disponibilidad: { bsonType: "bool" }
            }
          }
        },
        
        // Configuración de la lista
        es_publica: { bsonType: "bool" },
        es_compartible: { bsonType: "bool" },
        permite_sugerencias: { bsonType: "bool" },
        
        // Compartir y colaboración
        compartida_con: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              usuario_id: { bsonType: "string" },
              email: { bsonType: "string" },
              permisos: { 
                bsonType: "string",
                enum: ["ver", "comentar", "editar"]
              },
              fecha_compartido: { bsonType: "date" }
            }
          }
        },
        
        // Estadísticas
        total_productos: { bsonType: "int", minimum: 0 },
        valor_total_estimado: { bsonType: "decimal" },
        vistas_publicas: { bsonType: "int", minimum: 0 },
        
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Outfits y combinaciones
db.createCollection("outfits", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "nombre", "productos"],
      properties: {
        usuario_id: { bsonType: "string" },
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        
        productos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["producto_id", "categoria_outfit"],
            properties: {
              producto_id: { bsonType: "string" },
              variante_id: { bsonType: "string" },
              categoria_outfit: { 
                bsonType: "string",
                enum: ["superior", "inferior", "calzado", "accesorio", "exterior"]
              },
              es_principal: { bsonType: "bool" },
              alternativas: {
                bsonType: "array",
                items: { bsonType: "string" }
              }
            }
          }
        },
        
        // Información del outfit
        ocasion: { 
          bsonType: "string",
          enum: ["casual", "trabajo", "fiesta", "deporte", "formal", "viaje", "cita"]
        },
        temporada: { 
          bsonType: "string",
          enum: ["primavera", "verano", "otoño", "invierno", "todo_año"]
        },
        estilo: { bsonType: "string" },
        colores_dominantes: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        
        // Multimedia
        imagen_principal: { bsonType: "string" },
        imagenes_adicionales: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        
        // Social
        es_publico: { bsonType: "bool" },
        likes: { bsonType: "int", minimum: 0 },
        guardados: { bsonType: "int", minimum: 0 },
        compartidos: { bsonType: "int", minimum: 0 },
        
        // Tags y categorización
        tags: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        
        // Precio total
        precio_total: { bsonType: "decimal" },
        precio_con_descuentos: { bsonType: "decimal" },
        
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Seguimiento entre usuarios
db.createCollection("seguimientos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["seguidor_id", "seguido_id"],
      properties: {
        seguidor_id: { bsonType: "string" },
        seguido_id: { bsonType: "string" },
        tipo_seguimiento: { 
          bsonType: "string",
          enum: ["usuario", "influencer", "marca", "tienda"]
        },
        notificaciones_activas: { bsonType: "bool" },
        fecha_seguimiento: { bsonType: "date" }
      }
    }
  }
});

// Colección: Actividad social (feed)
db.createCollection("actividad_social", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "tipo_actividad"],
      properties: {
        usuario_id: { bsonType: "string" },
        tipo_actividad: { 
          bsonType: "string",
          enum: ["nueva_resena", "nuevo_outfit", "nueva_lista", "compra", "like", "comentario"]
        },
        
        // Contenido de la actividad
        contenido: {
          bsonType: "object",
          properties: {
            titulo: { bsonType: "string" },
            descripcion: { bsonType: "string" },
            imagen_url: { bsonType: "string" },
            enlace: { bsonType: "string" }
          }
        },
        
        // Referencias
        producto_id: { bsonType: "string" },
        outfit_id: { bsonType: "string" },
        lista_id: { bsonType: "string" },
        resena_id: { bsonType: "string" },
        
        // Interacciones
        likes: { bsonType: "int", minimum: 0 },
        comentarios: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              usuario_id: { bsonType: "string" },
              comentario: { bsonType: "string" },
              fecha_comentario: { bsonType: "date" }
            }
          }
        },
        
        // Visibilidad
        es_publica: { bsonType: "bool" },
        audiencia: { 
          bsonType: "string",
          enum: ["publica", "seguidores", "amigos", "privada"]
        },
        
        fecha_actividad: { bsonType: "date" }
      }
    }
  }
});

// Colección: Influencers y colaboradores
db.createCollection("influencers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "estado"],
      properties: {
        usuario_id: { bsonType: "string" },
        codigo_influencer: { bsonType: "string" },
        
        // Información del influencer
        nombre_publico: { bsonType: "string" },
        biografia: { bsonType: "string" },
        especialidades: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        
        // Redes sociales
        redes_sociales: {
          bsonType: "object",
          properties: {
            instagram: { bsonType: "string" },
            tiktok: { bsonType: "string" },
            youtube: { bsonType: "string" },
            facebook: { bsonType: "string" },
            twitter: { bsonType: "string" }
          }
        },
        
        // Métricas
        seguidores_stylehub: { bsonType: "int", minimum: 0 },
        seguidores_externos: { bsonType: "int", minimum: 0 },
        engagement_rate: { bsonType: "decimal" },
        
        // Programa de afiliados
        comision_porcentaje: { bsonType: "decimal" },
        codigo_descuento: { bsonType: "string" },
        ventas_generadas: { bsonType: "int", minimum: 0 },
        comisiones_ganadas: { bsonType: "decimal" },
        
        // Estado y verificación
        estado: { 
          bsonType: "string",
          enum: ["pendiente", "activo", "suspendido", "inactivo"]
        },
        verificado: { bsonType: "bool" },
        nivel: { 
          bsonType: "string",
          enum: ["micro", "macro", "mega", "celebrity"]
        },
        
        fecha_registro: { bsonType: "date" },
        fecha_aprobacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Contenido generado por usuarios (UGC)
db.createCollection("contenido_usuario", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "tipo_contenido"],
      properties: {
        usuario_id: { bsonType: "string" },
        tipo_contenido: { 
          bsonType: "string",
          enum: ["foto", "video", "outfit", "resena_visual", "tutorial"]
        },
        
        // Contenido multimedia
        archivos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              url: { bsonType: "string" },
              tipo: { bsonType: "string" },
              orden: { bsonType: "int" }
            }
          }
        },
        
        // Información del contenido
        titulo: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        hashtags: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        
        // Productos mencionados
        productos_etiquetados: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              producto_id: { bsonType: "string" },
              posicion_x: { bsonType: "decimal" },
              posicion_y: { bsonType: "decimal" }
            }
          }
        },
        
        // Moderación y calidad
        estado_moderacion: { 
          bsonType: "string",
          enum: ["pendiente", "aprobado", "rechazado"]
        },
        calidad_score: { bsonType: "decimal" },
        
        // Interacciones
        vistas: { bsonType: "int", minimum: 0 },
        likes: { bsonType: "int", minimum: 0 },
        compartidos: { bsonType: "int", minimum: 0 },
        
        // Uso comercial
        puede_usar_comercialmente: { bsonType: "bool" },
        usado_en_marketing: { bsonType: "bool" },
        compensacion: { bsonType: "decimal" },
        
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Índices para optimización
db.resenas_productos.createIndex({ producto_id: 1 });
db.resenas_productos.createIndex({ usuario_id: 1 });
db.resenas_productos.createIndex({ calificacion: 1 });
db.resenas_productos.createIndex({ estado: 1 });
db.resenas_productos.createIndex({ fecha_creacion: -1 });
db.resenas_productos.createIndex({ compra_verificada: 1 });

db.preguntas_productos.createIndex({ producto_id: 1 });
db.preguntas_productos.createIndex({ usuario_id: 1 });
db.preguntas_productos.createIndex({ estado: 1 });
db.preguntas_productos.createIndex({ categoria_pregunta: 1 });

db.listas_deseos.createIndex({ usuario_id: 1 });
db.listas_deseos.createIndex({ es_publica: 1 });
db.listas_deseos.createIndex({ "productos.producto_id": 1 });

db.outfits.createIndex({ usuario_id: 1 });
db.outfits.createIndex({ es_publico: 1 });
db.outfits.createIndex({ ocasion: 1 });
db.outfits.createIndex({ temporada: 1 });
db.outfits.createIndex({ "productos.producto_id": 1 });

db.seguimientos.createIndex({ seguidor_id: 1 });
db.seguimientos.createIndex({ seguido_id: 1 });
db.seguimientos.createIndex({ seguidor_id: 1, seguido_id: 1 }, { unique: true });

db.actividad_social.createIndex({ usuario_id: 1 });
db.actividad_social.createIndex({ tipo_actividad: 1 });
db.actividad_social.createIndex({ fecha_actividad: -1 });
db.actividad_social.createIndex({ es_publica: 1 });

db.influencers.createIndex({ usuario_id: 1 }, { unique: true });
db.influencers.createIndex({ codigo_influencer: 1 }, { unique: true });
db.influencers.createIndex({ estado: 1 });
db.influencers.createIndex({ nivel: 1 });

db.contenido_usuario.createIndex({ usuario_id: 1 });
db.contenido_usuario.createIndex({ tipo_contenido: 1 });
db.contenido_usuario.createIndex({ estado_moderacion: 1 });
db.contenido_usuario.createIndex({ "productos_etiquetados.producto_id": 1 });

// Datos iniciales de ejemplo
db.resenas_productos.insertOne({
  usuario_id: "usuario_ejemplo_001",
  producto_id: "producto_001",
  pedido_id: "pedido_001",
  calificacion: 5,
  titulo: "Excelente calidad y comodidad",
  comentario: "Me encanta este producto, la calidad es excepcional y muy cómodo de usar. Lo recomiendo totalmente.",
  calificaciones_detalle: {
    calidad: 5,
    talla: 5,
    comodidad: 5,
    durabilidad: 4,
    relacion_precio_calidad: 5
  },
  talla_comprada: "M",
  ajuste_talla: "perfecta",
  recomendaria: true,
  likes: 0,
  dislikes: 0,
  reportes: 0,
  estado: "aprobada",
  compra_verificada: true,
  fecha_compra: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
  fecha_creacion: new Date(),
  fecha_actualizacion: new Date()
});

db.listas_deseos.insertOne({
  usuario_id: "usuario_ejemplo_001",
  nombre: "Mi Lista Principal",
  descripcion: "Productos que me gustaría comprar próximamente",
  productos: [],
  es_publica: false,
  es_compartible: true,
  permite_sugerencias: true,
  total_productos: 0,
  valor_total_estimado: 0,
  vistas_publicas: 0,
  fecha_creacion: new Date(),
  fecha_actualizacion: new Date()
});