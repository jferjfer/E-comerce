// ====================================================
// STYLEHUB AI SERVICE - INTELIGENCIA ARTIFICIAL Y RECOMENDACIONES
// ====================================================

use('stylehub_ai');

// Colección: Conversaciones con María (Asesora IA)
db.createCollection("conversaciones_maria", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "session_id", "mensajes"],
      properties: {
        usuario_id: { bsonType: "string" },
        session_id: { bsonType: "string" },
        mensajes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["tipo", "contenido", "timestamp"],
            properties: {
              tipo: { 
                bsonType: "string", 
                enum: ["usuario", "maria", "sistema"] 
              },
              contenido: { bsonType: "string" },
              timestamp: { bsonType: "date" },
              metadata: { bsonType: "object" },
              productos_mencionados: {
                bsonType: "array",
                items: { bsonType: "string" }
              },
              sentimiento: { 
                bsonType: "string",
                enum: ["positivo", "negativo", "neutral"]
              },
              intencion: { bsonType: "string" },
              confianza: { bsonType: "decimal" }
            }
          }
        },
        contexto_conversacion: {
          bsonType: "object",
          properties: {
            tema_principal: { bsonType: "string" },
            productos_discutidos: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            preferencias_detectadas: { bsonType: "object" },
            estado_animo: { bsonType: "string" },
            nivel_satisfaccion: { bsonType: "decimal" }
          }
        },
        activa: { bsonType: "bool" },
        fecha_inicio: { bsonType: "date" },
        fecha_ultima_actividad: { bsonType: "date" },
        duracion_total_minutos: { bsonType: "int" }
      }
    }
  }
});

// Colección: Perfiles de usuario para IA
db.createCollection("perfiles_usuario_ia", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "perfil_moda"],
      properties: {
        usuario_id: { bsonType: "string" },
        perfil_moda: {
          bsonType: "object",
          properties: {
            estilo_dominante: { 
              bsonType: "string",
              enum: ["clasico", "urbano", "deportivo", "elegante", "bohemio", "minimalista", "vintage", "casual"]
            },
            colores_favoritos: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            tallas_preferidas: { bsonType: "object" },
            marcas_favoritas: {
              bsonType: "array", 
              items: { bsonType: "string" }
            },
            presupuesto_promedio: {
              bsonType: "object",
              properties: {
                minimo: { bsonType: "decimal" },
                maximo: { bsonType: "decimal" },
                promedio: { bsonType: "decimal" }
              }
            },
            ocasiones_compra: {
              bsonType: "array",
              items: { 
                bsonType: "string",
                enum: ["trabajo", "casual", "fiesta", "deporte", "formal", "viaje"]
              }
            },
            temporadas_activas: {
              bsonType: "array",
              items: { bsonType: "string" }
            }
          }
        },
        comportamiento_compra: {
          bsonType: "object",
          properties: {
            frecuencia_compra: { bsonType: "string" },
            horarios_activos: {
              bsonType: "array",
              items: { bsonType: "int" }
            },
            dispositivos_usados: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            canales_preferidos: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            sensibilidad_precio: { 
              bsonType: "string",
              enum: ["alta", "media", "baja"]
            },
            influencia_promociones: { bsonType: "decimal" },
            tiempo_decision_promedio: { bsonType: "int" }
          }
        },
        interacciones_ia: {
          bsonType: "object",
          properties: {
            total_conversaciones: { bsonType: "int" },
            tiempo_total_chat: { bsonType: "int" },
            recomendaciones_aceptadas: { bsonType: "int" },
            recomendaciones_rechazadas: { bsonType: "int" },
            tasa_conversion: { bsonType: "decimal" },
            satisfaccion_promedio: { bsonType: "decimal" },
            temas_frecuentes: {
              bsonType: "array",
              items: { bsonType: "string" }
            }
          }
        },
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Recomendaciones generadas por IA
db.createCollection("recomendaciones_ia", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "productos", "algoritmo", "contexto"],
      properties: {
        usuario_id: { bsonType: "string" },
        session_id: { bsonType: "string" },
        productos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["producto_id", "score", "motivos"],
            properties: {
              producto_id: { bsonType: "string" },
              variante_id: { bsonType: "string" },
              score: { bsonType: "decimal" },
              motivos: {
                bsonType: "array",
                items: { bsonType: "string" }
              },
              precio_recomendado: { bsonType: "decimal" },
              descuento_sugerido: { bsonType: "decimal" }
            }
          }
        },
        algoritmo: {
          bsonType: "object",
          required: ["tipo", "version"],
          properties: {
            tipo: { 
              bsonType: "string",
              enum: ["colaborativo", "contenido", "hibrido", "tendencias", "estilo_personal"]
            },
            version: { bsonType: "string" },
            parametros: { bsonType: "object" },
            confianza: { bsonType: "decimal" }
          }
        },
        contexto: {
          bsonType: "object",
          properties: {
            trigger: { 
              bsonType: "string",
              enum: ["navegacion", "chat", "compra", "abandono_carrito", "temporada"]
            },
            pagina_origen: { bsonType: "string" },
            productos_vistos: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            busquedas_recientes: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            carrito_actual: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            ocasion_objetivo: { bsonType: "string" },
            presupuesto_indicado: { bsonType: "decimal" }
          }
        },
        resultados: {
          bsonType: "object",
          properties: {
            mostradas: { bsonType: "int" },
            clicks: { bsonType: "int" },
            agregadas_carrito: { bsonType: "int" },
            compradas: { bsonType: "int" },
            tiempo_visualizacion: { bsonType: "int" },
            feedback_usuario: { 
              bsonType: "string",
              enum: ["me_gusta", "no_me_gusta", "no_relevante", "muy_caro"]
            }
          }
        },
        activa: { bsonType: "bool" },
        fecha_generacion: { bsonType: "date" },
        fecha_expiracion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Análisis de tendencias
db.createCollection("analisis_tendencias", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["periodo", "categoria", "tendencias"],
      properties: {
        periodo: {
          bsonType: "object",
          required: ["inicio", "fin"],
          properties: {
            inicio: { bsonType: "date" },
            fin: { bsonType: "date" },
            tipo: { 
              bsonType: "string",
              enum: ["semanal", "mensual", "trimestral", "anual"]
            }
          }
        },
        categoria: { bsonType: "string" },
        subcategoria: { bsonType: "string" },
        tendencias: {
          bsonType: "object",
          properties: {
            productos_populares: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  producto_id: { bsonType: "string" },
                  score_popularidad: { bsonType: "decimal" },
                  crecimiento_porcentual: { bsonType: "decimal" },
                  ventas_periodo: { bsonType: "int" },
                  vistas_periodo: { bsonType: "int" }
                }
              }
            },
            colores_trending: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  color: { bsonType: "string" },
                  hex_code: { bsonType: "string" },
                  popularidad: { bsonType: "decimal" },
                  crecimiento: { bsonType: "decimal" }
                }
              }
            },
            estilos_emergentes: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  estilo: { bsonType: "string" },
                  descripcion: { bsonType: "string" },
                  score_emergencia: { bsonType: "decimal" },
                  productos_asociados: {
                    bsonType: "array",
                    items: { bsonType: "string" }
                  }
                }
              }
            },
            precios_promedio: {
              bsonType: "object",
              properties: {
                actual: { bsonType: "decimal" },
                anterior: { bsonType: "decimal" },
                variacion_porcentual: { bsonType: "decimal" }
              }
            }
          }
        },
        insights: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              tipo: { bsonType: "string" },
              descripcion: { bsonType: "string" },
              confianza: { bsonType: "decimal" },
              impacto_estimado: { bsonType: "string" }
            }
          }
        },
        fecha_analisis: { bsonType: "date" },
        algoritmo_version: { bsonType: "string" }
      }
    }
  }
});

// Colección: Sesiones de realidad aumentada
db.createCollection("sesiones_ar", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "productos_probados"],
      properties: {
        usuario_id: { bsonType: "string" },
        session_id: { bsonType: "string" },
        dispositivo: {
          bsonType: "object",
          properties: {
            tipo: { 
              bsonType: "string",
              enum: ["mobile", "tablet", "desktop", "ar_glasses"]
            },
            modelo: { bsonType: "string" },
            sistema_operativo: { bsonType: "string" },
            capacidades_ar: {
              bsonType: "array",
              items: { bsonType: "string" }
            }
          }
        },
        productos_probados: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["producto_id", "tiempo_visualizacion"],
            properties: {
              producto_id: { bsonType: "string" },
              variante_id: { bsonType: "string" },
              tiempo_visualizacion: { bsonType: "int" },
              interacciones: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  properties: {
                    tipo: { 
                      bsonType: "string",
                      enum: ["rotar", "zoom", "cambiar_color", "cambiar_talla", "captura"]
                    },
                    timestamp: { bsonType: "date" },
                    parametros: { bsonType: "object" }
                  }
                }
              },
              calificacion: { bsonType: "int" },
              agregado_carrito: { bsonType: "bool" },
              compartido: { bsonType: "bool" }
            }
          }
        },
        metricas_sesion: {
          bsonType: "object",
          properties: {
            duracion_total: { bsonType: "int" },
            productos_totales: { bsonType: "int" },
            interacciones_totales: { bsonType: "int" },
            capturas_realizadas: { bsonType: "int" },
            productos_agregados_carrito: { bsonType: "int" },
            nivel_engagement: { bsonType: "decimal" },
            calidad_tracking: { 
              bsonType: "string",
              enum: ["excelente", "buena", "regular", "pobre"]
            }
          }
        },
        feedback: {
          bsonType: "object",
          properties: {
            satisfaccion_general: { bsonType: "int" },
            facilidad_uso: { bsonType: "int" },
            realismo: { bsonType: "int" },
            utilidad: { bsonType: "int" },
            comentarios: { bsonType: "string" },
            problemas_reportados: {
              bsonType: "array",
              items: { bsonType: "string" }
            }
          }
        },
        fecha_inicio: { bsonType: "date" },
        fecha_fin: { bsonType: "date" }
      }
    }
  }
});

// Colección: Configuración de algoritmos IA
db.createCollection("configuracion_algoritmos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "tipo", "parametros"],
      properties: {
        nombre: { bsonType: "string" },
        tipo: { 
          bsonType: "string",
          enum: ["recomendacion", "chat", "tendencias", "ar", "personalizacion"]
        },
        version: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        parametros: {
          bsonType: "object",
          properties: {
            pesos: { bsonType: "object" },
            umbrales: { bsonType: "object" },
            limites: { bsonType: "object" },
            configuracion_especifica: { bsonType: "object" }
          }
        },
        metricas_rendimiento: {
          bsonType: "object",
          properties: {
            precision: { bsonType: "decimal" },
            recall: { bsonType: "decimal" },
            f1_score: { bsonType: "decimal" },
            tiempo_respuesta_ms: { bsonType: "int" },
            tasa_conversion: { bsonType: "decimal" }
          }
        },
        activo: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Índices para optimización
db.conversaciones_maria.createIndex({ usuario_id: 1 });
db.conversaciones_maria.createIndex({ session_id: 1 });
db.conversaciones_maria.createIndex({ "fecha_ultima_actividad": -1 });
db.conversaciones_maria.createIndex({ activa: 1 });

db.perfiles_usuario_ia.createIndex({ usuario_id: 1 }, { unique: true });
db.perfiles_usuario_ia.createIndex({ "perfil_moda.estilo_dominante": 1 });
db.perfiles_usuario_ia.createIndex({ "fecha_actualizacion": -1 });

db.recomendaciones_ia.createIndex({ usuario_id: 1 });
db.recomendaciones_ia.createIndex({ session_id: 1 });
db.recomendaciones_ia.createIndex({ "algoritmo.tipo": 1 });
db.recomendaciones_ia.createIndex({ fecha_generacion: -1 });
db.recomendaciones_ia.createIndex({ fecha_expiracion: 1 }, { expireAfterSeconds: 0 });

db.analisis_tendencias.createIndex({ categoria: 1 });
db.analisis_tendencias.createIndex({ "periodo.inicio": 1, "periodo.fin": 1 });
db.analisis_tendencias.createIndex({ fecha_analisis: -1 });

db.sesiones_ar.createIndex({ usuario_id: 1 });
db.sesiones_ar.createIndex({ fecha_inicio: -1 });
db.sesiones_ar.createIndex({ "dispositivo.tipo": 1 });

db.configuracion_algoritmos.createIndex({ tipo: 1 });
db.configuracion_algoritmos.createIndex({ activo: 1 });

// Datos iniciales
db.configuracion_algoritmos.insertMany([
  {
    nombre: "María - Asesora Personal",
    tipo: "chat",
    version: "2.0",
    descripcion: "Asistente conversacional especializada en moda y estilo personal",
    parametros: {
      modelo_lenguaje: "gpt-4-turbo",
      temperatura: 0.7,
      max_tokens: 500,
      personalidad: {
        tono: "amigable",
        estilo: "profesional_cercano",
        especialidad: "moda_femenina_masculina",
        idioma_principal: "español"
      },
      contexto_memoria: {
        conversaciones_anteriores: 5,
        productos_recordados: 20,
        preferencias_usuario: true
      }
    },
    metricas_rendimiento: {
      satisfaccion_promedio: 4.7,
      tiempo_respuesta_ms: 800,
      tasa_conversion: 0.23,
      resolucion_consultas: 0.89
    },
    activo: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  },
  {
    nombre: "Recomendador Híbrido",
    tipo: "recomendacion",
    version: "3.1",
    descripcion: "Sistema híbrido de recomendaciones basado en colaborativo + contenido",
    parametros: {
      pesos: {
        colaborativo: 0.4,
        contenido: 0.3,
        popularidad: 0.2,
        tendencias: 0.1
      },
      umbrales: {
        similitud_minima: 0.3,
        confianza_minima: 0.5,
        productos_minimos: 5
      },
      limites: {
        recomendaciones_max: 20,
        tiempo_cache_horas: 24
      }
    },
    metricas_rendimiento: {
      precision: 0.78,
      recall: 0.65,
      f1_score: 0.71,
      tiempo_respuesta_ms: 150,
      tasa_conversion: 0.18
    },
    activo: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  },
  {
    nombre: "Analizador de Tendencias",
    tipo: "tendencias",
    version: "1.5",
    descripcion: "Análisis predictivo de tendencias de moda basado en datos de comportamiento",
    parametros: {
      ventana_analisis_dias: 30,
      umbral_tendencia: 0.15,
      factores_considerados: [
        "ventas", "vistas", "busquedas", "redes_sociales", "temporada"
      ],
      pesos_factores: {
        ventas: 0.35,
        vistas: 0.25,
        busquedas: 0.20,
        redes_sociales: 0.15,
        temporada: 0.05
      }
    },
    metricas_rendimiento: {
      precision_prediccion: 0.73,
      tiempo_procesamiento_min: 45,
      tendencias_detectadas_mes: 25
    },
    activo: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  }
]);

// Crear perfil de usuario ejemplo
db.perfiles_usuario_ia.insertOne({
  usuario_id: "ejemplo_usuario_001",
  perfil_moda: {
    estilo_dominante: "casual",
    colores_favoritos: ["azul", "blanco", "gris", "negro"],
    tallas_preferidas: {
      camisetas: "M",
      pantalones: "32",
      zapatos: "42"
    },
    marcas_favoritas: ["StyleHub Original", "Urban Style"],
    presupuesto_promedio: {
      minimo: 50000,
      maximo: 200000,
      promedio: 120000
    },
    ocasiones_compra: ["trabajo", "casual", "deporte"],
    temporadas_activas: ["todo_año"]
  },
  comportamiento_compra: {
    frecuencia_compra: "mensual",
    horarios_activos: [10, 11, 12, 19, 20, 21],
    dispositivos_usados: ["mobile", "desktop"],
    canales_preferidos: ["web", "app"],
    sensibilidad_precio: "media",
    influencia_promociones: 0.7,
    tiempo_decision_promedio: 15
  },
  interacciones_ia: {
    total_conversaciones: 0,
    tiempo_total_chat: 0,
    recomendaciones_aceptadas: 0,
    recomendaciones_rechazadas: 0,
    tasa_conversion: 0.0,
    satisfaccion_promedio: 0.0,
    temas_frecuentes: []
  },
  fecha_creacion: new Date(),
  fecha_actualizacion: new Date()
});