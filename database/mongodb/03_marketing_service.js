// ====================================================
// STYLEHUB MARKETING SERVICE - CAMPAÑAS, FIDELIZACIÓN Y ANALYTICS
// ====================================================

use('stylehub_marketing');

// Colección: Campañas de marketing
db.createCollection("campanas_marketing", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "tipo", "estado", "fecha_inicio", "fecha_fin"],
      properties: {
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        tipo: { 
          bsonType: "string",
          enum: ["email", "sms", "push", "banner", "popup", "social", "influencer", "retargeting"]
        },
        subtipo: { bsonType: "string" },
        
        // Estado y programación
        estado: { 
          bsonType: "string",
          enum: ["borrador", "programada", "activa", "pausada", "completada", "cancelada"]
        },
        fecha_inicio: { bsonType: "date" },
        fecha_fin: { bsonType: "date" },
        zona_horaria: { bsonType: "string" },
        
        // Segmentación de audiencia
        audiencia_objetivo: {
          bsonType: "object",
          properties: {
            segmentos: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            filtros_demograficos: {
              bsonType: "object",
              properties: {
                edad_min: { bsonType: "int" },
                edad_max: { bsonType: "int" },
                genero: {
                  bsonType: "array",
                  items: { bsonType: "string" }
                },
                ubicacion: {
                  bsonType: "array",
                  items: { bsonType: "string" }
                }
              }
            },
            filtros_comportamiento: {
              bsonType: "object",
              properties: {
                compras_recientes: { bsonType: "bool" },
                carrito_abandonado: { bsonType: "bool" },
                productos_vistos: {
                  bsonType: "array",
                  items: { bsonType: "string" }
                },
                categorias_interes: {
                  bsonType: "array",
                  items: { bsonType: "string" }
                },
                valor_compras_min: { bsonType: "decimal" },
                valor_compras_max: { bsonType: "decimal" }
              }
            },
            usuarios_incluidos: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            usuarios_excluidos: {
              bsonType: "array",
              items: { bsonType: "string" }
            }
          }
        },
        
        // Contenido de la campaña
        contenido: {
          bsonType: "object",
          properties: {
            asunto: { bsonType: "string" },
            titulo: { bsonType: "string" },
            mensaje: { bsonType: "string" },
            html_content: { bsonType: "string" },
            imagenes: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  url: { bsonType: "string" },
                  alt_text: { bsonType: "string" },
                  posicion: { bsonType: "string" }
                }
              }
            },
            call_to_action: {
              bsonType: "object",
              properties: {
                texto: { bsonType: "string" },
                url: { bsonType: "string" },
                color: { bsonType: "string" }
              }
            },
            personalizacion: {
              bsonType: "object",
              properties: {
                usar_nombre: { bsonType: "bool" },
                productos_recomendados: { bsonType: "bool" },
                descuentos_personalizados: { bsonType: "bool" }
              }
            }
          }
        },
        
        // Configuración de envío
        configuracion_envio: {
          bsonType: "object",
          properties: {
            remitente_nombre: { bsonType: "string" },
            remitente_email: { bsonType: "string" },
            reply_to: { bsonType: "string" },
            frecuencia: { 
              bsonType: "string",
              enum: ["unica", "diaria", "semanal", "mensual", "personalizada"]
            },
            horario_envio: { bsonType: "string" },
            limite_envios_dia: { bsonType: "int" }
          }
        },
        
        // Objetivos y KPIs
        objetivos: {
          bsonType: "object",
          properties: {
            objetivo_principal: { 
              bsonType: "string",
              enum: ["ventas", "engagement", "awareness", "retention", "acquisition"]
            },
            meta_apertura: { bsonType: "decimal" },
            meta_clicks: { bsonType: "decimal" },
            meta_conversion: { bsonType: "decimal" },
            meta_revenue: { bsonType: "decimal" }
          }
        },
        
        // Presupuesto
        presupuesto: {
          bsonType: "object",
          properties: {
            total: { bsonType: "decimal" },
            gastado: { bsonType: "decimal" },
            costo_por_envio: { bsonType: "decimal" },
            costo_por_click: { bsonType: "decimal" }
          }
        },
        
        // Métricas en tiempo real
        metricas: {
          bsonType: "object",
          properties: {
            enviados: { bsonType: "int" },
            entregados: { bsonType: "int" },
            aperturas: { bsonType: "int" },
            clicks: { bsonType: "int" },
            conversiones: { bsonType: "int" },
            revenue_generado: { bsonType: "decimal" },
            tasa_apertura: { bsonType: "decimal" },
            tasa_click: { bsonType: "decimal" },
            tasa_conversion: { bsonType: "decimal" },
            roi: { bsonType: "decimal" }
          }
        },
        
        // Información de creación
        creado_por: { bsonType: "string" },
        aprobado_por: { bsonType: "string" },
        fecha_aprobacion: { bsonType: "date" },
        
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Segmentos de usuarios
db.createCollection("segmentos_usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "criterios"],
      properties: {
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        
        criterios: {
          bsonType: "object",
          properties: {
            demograficos: {
              bsonType: "object",
              properties: {
                edad_min: { bsonType: "int" },
                edad_max: { bsonType: "int" },
                genero: { bsonType: "string" },
                ubicacion: { bsonType: "string" },
                nivel_ingresos: { bsonType: "string" }
              }
            },
            comportamiento: {
              bsonType: "object",
              properties: {
                frecuencia_compra: { bsonType: "string" },
                valor_promedio_compra: { bsonType: "decimal" },
                categorias_favoritas: {
                  bsonType: "array",
                  items: { bsonType: "string" }
                },
                ultima_compra_dias: { bsonType: "int" },
                total_compras: { bsonType: "int" },
                canal_preferido: { bsonType: "string" }
              }
            },
            engagement: {
              bsonType: "object",
              properties: {
                abre_emails: { bsonType: "bool" },
                hace_click_emails: { bsonType: "bool" },
                activo_app: { bsonType: "bool" },
                sigue_redes_sociales: { bsonType: "bool" },
                deja_resenas: { bsonType: "bool" }
              }
            }
          }
        },
        
        // Usuarios en el segmento
        usuarios_incluidos: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        total_usuarios: { bsonType: "int" },
        
        // Configuración
        actualizacion_automatica: { bsonType: "bool" },
        frecuencia_actualizacion: { bsonType: "string" },
        
        // Métricas del segmento
        metricas: {
          bsonType: "object",
          properties: {
            valor_promedio_cliente: { bsonType: "decimal" },
            tasa_retencion: { bsonType: "decimal" },
            tasa_conversion: { bsonType: "decimal" },
            engagement_promedio: { bsonType: "decimal" }
          }
        },
        
        activo: { bsonType: "bool" },
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Programa de fidelización
db.createCollection("programa_fidelizacion", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "nivel_actual"],
      properties: {
        usuario_id: { bsonType: "string" },
        
        // Puntos y nivel
        puntos_actuales: { bsonType: "int", minimum: 0 },
        puntos_totales_ganados: { bsonType: "int", minimum: 0 },
        puntos_canjeados: { bsonType: "int", minimum: 0 },
        nivel_actual: { 
          bsonType: "string",
          enum: ["bronce", "plata", "oro", "platino", "diamante"]
        },
        puntos_siguiente_nivel: { bsonType: "int" },
        
        // Historial de puntos
        historial_puntos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["tipo", "puntos", "fecha"],
            properties: {
              tipo: { 
                bsonType: "string",
                enum: ["ganados_compra", "ganados_resena", "ganados_referido", "canjeados", "expirados", "bonus"]
              },
              puntos: { bsonType: "int" },
              descripcion: { bsonType: "string" },
              referencia_id: { bsonType: "string" },
              fecha: { bsonType: "date" }
            }
          }
        },
        
        // Beneficios del nivel
        beneficios_activos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              tipo: { 
                bsonType: "string",
                enum: ["descuento", "envio_gratis", "acceso_exclusivo", "puntos_extra", "soporte_prioritario"]
              },
              valor: { bsonType: "decimal" },
              descripcion: { bsonType: "string" },
              fecha_expiracion: { bsonType: "date" }
            }
          }
        },
        
        // Referidos
        codigo_referido: { bsonType: "string" },
        referidos_exitosos: { bsonType: "int", minimum: 0 },
        puntos_por_referidos: { bsonType: "int", minimum: 0 },
        
        // Configuración
        notificaciones_activas: { bsonType: "bool" },
        acepta_comunicaciones: { bsonType: "bool" },
        
        fecha_inscripcion: { bsonType: "date" },
        fecha_ultima_actividad: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Recompensas y canjes
db.createCollection("recompensas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nombre", "tipo", "costo_puntos"],
      properties: {
        nombre: { bsonType: "string" },
        descripcion: { bsonType: "string" },
        tipo: { 
          bsonType: "string",
          enum: ["descuento", "producto_gratis", "envio_gratis", "acceso_exclusivo", "experiencia"]
        },
        
        // Configuración de la recompensa
        costo_puntos: { bsonType: "int", minimum: 1 },
        valor_monetario: { bsonType: "decimal" },
        
        // Restricciones
        nivel_minimo_requerido: { 
          bsonType: "string",
          enum: ["bronce", "plata", "oro", "platino", "diamante"]
        },
        limite_canjes_usuario: { bsonType: "int" },
        limite_canjes_total: { bsonType: "int" },
        canjes_realizados: { bsonType: "int", minimum: 0 },
        
        // Validez
        fecha_inicio: { bsonType: "date" },
        fecha_fin: { bsonType: "date" },
        dias_validez_canje: { bsonType: "int" },
        
        // Configuración específica
        configuracion: {
          bsonType: "object",
          properties: {
            porcentaje_descuento: { bsonType: "decimal" },
            monto_descuento: { bsonType: "decimal" },
            producto_id: { bsonType: "string" },
            categoria_aplicable: { bsonType: "string" },
            monto_minimo_compra: { bsonType: "decimal" }
          }
        },
        
        // Multimedia
        imagen_url: { bsonType: "string" },
        icono_url: { bsonType: "string" },
        
        activa: { bsonType: "bool" },
        destacada: { bsonType: "bool" },
        
        fecha_creacion: { bsonType: "date" },
        fecha_actualizacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Canjes realizados
db.createCollection("canjes_realizados", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "recompensa_id", "puntos_utilizados"],
      properties: {
        usuario_id: { bsonType: "string" },
        recompensa_id: { bsonType: "string" },
        codigo_canje: { bsonType: "string" },
        
        // Información del canje
        puntos_utilizados: { bsonType: "int", minimum: 1 },
        valor_obtenido: { bsonType: "decimal" },
        
        // Estado del canje
        estado: { 
          bsonType: "string",
          enum: ["activo", "utilizado", "expirado", "cancelado"]
        },
        fecha_canje: { bsonType: "date" },
        fecha_expiracion: { bsonType: "date" },
        fecha_utilizacion: { bsonType: "date" },
        
        // Uso del canje
        pedido_id: { bsonType: "string" },
        descuento_aplicado: { bsonType: "decimal" },
        
        // Información adicional
        notas: { bsonType: "string" },
        
        fecha_creacion: { bsonType: "date" }
      }
    }
  }
});

// Colección: Analytics de marketing
db.createCollection("analytics_marketing", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["fecha", "tipo_metrica"],
      properties: {
        fecha: { bsonType: "date" },
        tipo_metrica: { 
          bsonType: "string",
          enum: ["diaria", "semanal", "mensual", "campana", "segmento"]
        },
        
        // Métricas de email marketing
        email_marketing: {
          bsonType: "object",
          properties: {
            emails_enviados: { bsonType: "int" },
            emails_entregados: { bsonType: "int" },
            emails_abiertos: { bsonType: "int" },
            clicks_totales: { bsonType: "int" },
            clicks_unicos: { bsonType: "int" },
            conversiones: { bsonType: "int" },
            revenue_generado: { bsonType: "decimal" },
            tasa_entrega: { bsonType: "decimal" },
            tasa_apertura: { bsonType: "decimal" },
            tasa_click: { bsonType: "decimal" },
            tasa_conversion: { bsonType: "decimal" }
          }
        },
        
        // Métricas de fidelización
        fidelizacion: {
          bsonType: "object",
          properties: {
            nuevos_miembros: { bsonType: "int" },
            puntos_otorgados: { bsonType: "int" },
            puntos_canjeados: { bsonType: "int" },
            canjes_realizados: { bsonType: "int" },
            valor_canjes: { bsonType: "decimal" },
            miembros_activos: { bsonType: "int" },
            tasa_participacion: { bsonType: "decimal" }
          }
        },
        
        // Métricas de segmentación
        segmentacion: {
          bsonType: "object",
          properties: {
            segmentos_activos: { bsonType: "int" },
            usuarios_segmentados: { bsonType: "int" },
            precision_segmentacion: { bsonType: "decimal" },
            efectividad_campanas: { bsonType: "decimal" }
          }
        },
        
        // ROI y costos
        financiero: {
          bsonType: "object",
          properties: {
            inversion_total: { bsonType: "decimal" },
            revenue_atribuido: { bsonType: "decimal" },
            roi: { bsonType: "decimal" },
            costo_por_adquisicion: { bsonType: "decimal" },
            valor_vida_cliente: { bsonType: "decimal" }
          }
        },
        
        // Referencia específica
        campana_id: { bsonType: "string" },
        segmento_id: { bsonType: "string" },
        
        fecha_calculo: { bsonType: "date" }
      }
    }
  }
});

// Índices para optimización
db.campanas_marketing.createIndex({ estado: 1 });
db.campanas_marketing.createIndex({ tipo: 1 });
db.campanas_marketing.createIndex({ fecha_inicio: 1, fecha_fin: 1 });
db.campanas_marketing.createIndex({ creado_por: 1 });
db.campanas_marketing.createIndex({ "audiencia_objetivo.segmentos": 1 });

db.segmentos_usuarios.createIndex({ nombre: 1 }, { unique: true });
db.segmentos_usuarios.createIndex({ activo: 1 });
db.segmentos_usuarios.createIndex({ usuarios_incluidos: 1 });

db.programa_fidelizacion.createIndex({ usuario_id: 1 }, { unique: true });
db.programa_fidelizacion.createIndex({ nivel_actual: 1 });
db.programa_fidelizacion.createIndex({ puntos_actuales: 1 });
db.programa_fidelizacion.createIndex({ codigo_referido: 1 });

db.recompensas.createIndex({ tipo: 1 });
db.recompensas.createIndex({ costo_puntos: 1 });
db.recompensas.createIndex({ activa: 1 });
db.recompensas.createIndex({ nivel_minimo_requerido: 1 });

db.canjes_realizados.createIndex({ usuario_id: 1 });
db.canjes_realizados.createIndex({ recompensa_id: 1 });
db.canjes_realizados.createIndex({ codigo_canje: 1 }, { unique: true });
db.canjes_realizados.createIndex({ estado: 1 });
db.canjes_realizados.createIndex({ fecha_expiracion: 1 });

db.analytics_marketing.createIndex({ fecha: 1 });
db.analytics_marketing.createIndex({ tipo_metrica: 1 });
db.analytics_marketing.createIndex({ campana_id: 1 });
db.analytics_marketing.createIndex({ segmento_id: 1 });

// Datos iniciales
db.segmentos_usuarios.insertMany([
  {
    nombre: "Clientes VIP",
    descripcion: "Clientes con alto valor de compra y frecuencia",
    criterios: {
      comportamiento: {
        valor_promedio_compra: 500000,
        total_compras: 10,
        ultima_compra_dias: 30
      }
    },
    usuarios_incluidos: [],
    total_usuarios: 0,
    actualizacion_automatica: true,
    frecuencia_actualizacion: "semanal",
    activo: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  },
  {
    nombre: "Nuevos Clientes",
    descripcion: "Usuarios registrados en los últimos 30 días",
    criterios: {
      comportamiento: {
        total_compras: 0,
        ultima_compra_dias: null
      }
    },
    usuarios_incluidos: [],
    total_usuarios: 0,
    actualizacion_automatica: true,
    frecuencia_actualizacion: "diaria",
    activo: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  }
]);

db.recompensas.insertMany([
  {
    nombre: "10% de Descuento",
    descripcion: "Descuento del 10% en tu próxima compra",
    tipo: "descuento",
    costo_puntos: 1000,
    valor_monetario: 50000,
    nivel_minimo_requerido: "bronce",
    limite_canjes_usuario: 1,
    canjes_realizados: 0,
    fecha_inicio: new Date(),
    fecha_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
    dias_validez_canje: 30,
    configuracion: {
      porcentaje_descuento: 10,
      monto_minimo_compra: 100000
    },
    activa: true,
    destacada: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  },
  {
    nombre: "Envío Gratuito",
    descripcion: "Envío gratuito en tu próximo pedido",
    tipo: "envio_gratis",
    costo_puntos: 500,
    valor_monetario: 15000,
    nivel_minimo_requerido: "bronce",
    limite_canjes_usuario: 2,
    canjes_realizados: 0,
    fecha_inicio: new Date(),
    fecha_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    dias_validez_canje: 60,
    configuracion: {
      monto_minimo_compra: 50000
    },
    activa: true,
    destacada: false,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  }
]);