from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import random
from datetime import datetime
from config.database import conectar_bd, desconectar_bd, get_database

app = FastAPI(
    title="AI Service v2.0",
    description="Servicio de IA para recomendaciones personalizadas y análisis de estilo",
    version="2.0.0"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de inicio y cierre
@app.on_event("startup")
async def startup_event():
    await conectar_bd()
    await inicializar_datos()

@app.on_event("shutdown")
async def shutdown_event():
    await desconectar_bd()

async def inicializar_datos():
    """Inicializar datos si no existen"""
    db = get_database()
    
    # Verificar si ya hay productos
    productos_count = await db.productos.count_documents({})
    if productos_count == 0:
        # Insertar productos iniciales para IA
        productos_iniciales = [
            {
                "id": "1", "nombre": "Vestido Profesional IA", "precio": 89.99,
                "categoria": "Vestidos", "estilo": "profesional", "colores": ["Negro", "Azul marino", "Gris"],
                "compatibilidad_ia": 98, "popularidad": 95
            },
            {
                "id": "2", "nombre": "Camisa Casual IA", "precio": 47.90,
                "categoria": "Camisas", "estilo": "casual", "colores": ["Blanco", "Beige", "Azul claro"],
                "compatibilidad_ia": 95, "popularidad": 88
            }
        ]
        await db.productos.insert_many(productos_iniciales)
        print("✅ Productos IA iniciales insertados en MongoDB")

# Modelos de datos
class PerfilUsuario(BaseModel):
    usuario_id: str
    estilo_preferido: str
    colores_favoritos: List[str]
    talla: str
    presupuesto_max: Optional[float] = None

class RecomendacionRequest(BaseModel):
    usuario_id: str
    categoria: Optional[str] = None
    ocasion: Optional[str] = None
    limite: int = 5



# Endpoints de recomendaciones
@app.post("/api/recomendaciones/personalizada")
async def obtener_recomendaciones_personalizadas(request: RecomendacionRequest):
    print(f"🤖 Generando recomendaciones para usuario {request.usuario_id}")
    
    db = get_database()
    
    # Obtener perfil del usuario desde MongoDB
    perfil_doc = await db.perfiles.find_one({"usuario_id": request.usuario_id})
    perfil = perfil_doc or {
        "estilo_preferido": "casual",
        "colores_favoritos": ["Negro", "Blanco", "Azul"],
        "talla": "M"
    }
    
    # Obtener productos desde MongoDB
    filtro_productos = {}
    if request.categoria:
        filtro_productos["categoria"] = {"$regex": request.categoria, "$options": "i"}
    
    productos_cursor = db.productos.find(filtro_productos)
    productos = await productos_cursor.to_list(length=None)
    
    # Algoritmo de recomendación
    productos_recomendados = []
    
    for producto in productos:
        score = 0
        
        # Compatibilidad de estilo
        if producto.get("estilo") == perfil.get("estilo_preferido"):
            score += 30
        
        # Compatibilidad de colores
        colores_comunes = set(producto.get("colores", [])) & set(perfil.get("colores_favoritos", []))
        score += len(colores_comunes) * 10
        
        # Compatibilidad IA del producto
        score += producto.get("compatibilidad_ia", 0) * 0.3
        
        # Popularidad
        score += producto.get("popularidad", 0) * 0.2
        
        # Limpiar _id de MongoDB
        if "_id" in producto:
            del producto["_id"]
        
        producto["score_recomendacion"] = round(score, 2)
        productos_recomendados.append(producto)
    
    # Ordenar por score y limitar resultados
    productos_recomendados.sort(key=lambda x: x["score_recomendacion"], reverse=True)
    productos_recomendados = productos_recomendados[:request.limite]
    
    return {
        "recomendaciones": productos_recomendados,
        "total": len(productos_recomendados),
        "algoritmo": "IA_personalizada_v2",
        "perfil_usado": perfil
    }

@app.get("/api/recomendaciones/tendencias")
async def obtener_tendencias():
    print("📈 Obteniendo tendencias de moda")
    
    tendencias = [
        {
            "id": "1",
            "nombre": "Moda Sostenible",
            "descripcion": "Productos eco-friendly y sostenibles",
            "productos_relacionados": ["1", "2", "3"],
            "crecimiento": 45.2,
            "popularidad": 92
        },
        {
            "id": "2", 
            "nombre": "Oficina Moderna",
            "descripcion": "Looks profesionales para el trabajo híbrido",
            "productos_relacionados": ["1", "4"],
            "crecimiento": 32.8,
            "popularidad": 88
        },
        {
            "id": "3",
            "nombre": "Casual Chic",
            "descripcion": "Elegancia relajada para el día a día",
            "productos_relacionados": ["2", "3"],
            "crecimiento": 28.5,
            "popularidad": 85
        }
    ]
    
    return {"tendencias": tendencias}

@app.post("/api/perfil/actualizar")
async def actualizar_perfil_usuario(perfil: PerfilUsuario):
    print(f"👤 Actualizando perfil para usuario {perfil.usuario_id}")
    
    db = get_database()
    
    perfil_data = {
        "usuario_id": perfil.usuario_id,
        "estilo_preferido": perfil.estilo_preferido,
        "colores_favoritos": perfil.colores_favoritos,
        "talla": perfil.talla,
        "presupuesto_max": perfil.presupuesto_max,
        "fecha_actualizacion": datetime.now().isoformat()
    }
    
    # Actualizar o insertar perfil
    await db.perfiles.update_one(
        {"usuario_id": perfil.usuario_id},
        {"$set": perfil_data},
        upsert=True
    )
    
    return {
        "mensaje": "Perfil actualizado exitosamente",
        "perfil": perfil_data
    }

@app.get("/api/perfil/{usuario_id}")
async def obtener_perfil_usuario(usuario_id: str):
    db = get_database()
    
    perfil = await db.perfiles.find_one({"usuario_id": usuario_id})
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    # Limpiar _id de MongoDB
    if "_id" in perfil:
        del perfil["_id"]
    
    return {"perfil": perfil}

@app.post("/api/analisis/compatibilidad")
async def analizar_compatibilidad(data: dict):
    """Analiza la compatibilidad entre productos y el estilo del usuario"""
    usuario_id = data.get("usuario_id")
    productos_ids = data.get("productos_ids", [])
    
    print(f"🔍 Analizando compatibilidad para usuario {usuario_id}")
    
    perfil = perfiles_usuarios.get(usuario_id, {
        "estilo_preferido": "casual",
        "colores_favoritos": ["Negro", "Blanco"]
    })
    
    analisis = []
    
    for producto_id in productos_ids:
        producto = next((p for p in productos_db if p["id"] == producto_id), None)
        if producto:
            compatibilidad = random.randint(85, 99)  # Simulación
            
            analisis.append({
                "producto_id": producto_id,
                "nombre": producto["nombre"],
                "compatibilidad": compatibilidad,
                "razones": [
                    f"Coincide con tu estilo {perfil['estilo_preferido']}",
                    "Colores que te favorecen",
                    "Alta calidad y durabilidad"
                ]
            })
    
    return {
        "analisis": analisis,
        "recomendacion_general": "Excelente selección para tu estilo personal"
    }

@app.get("/api/estilos/sugerencias")
async def obtener_sugerencias_estilo():
    """Obtiene sugerencias de estilos disponibles"""
    print("🎨 Obteniendo sugerencias de estilo")
    
    estilos = [
        {
            "id": "casual",
            "nombre": "Casual",
            "descripcion": "Cómodo y relajado para el día a día",
            "colores_recomendados": ["Azul", "Blanco", "Gris", "Beige"],
            "productos_ejemplo": ["2", "3"]
        },
        {
            "id": "profesional",
            "nombre": "Profesional",
            "descripcion": "Elegante y formal para el trabajo",
            "colores_recomendados": ["Negro", "Azul marino", "Gris oscuro", "Blanco"],
            "productos_ejemplo": ["1", "4"]
        },
        {
            "id": "versatil",
            "nombre": "Versátil",
            "descripcion": "Adaptable a múltiples ocasiones",
            "colores_recomendados": ["Negro", "Gris", "Azul", "Blanco"],
            "productos_ejemplo": ["3", "1"]
        }
    ]
    
    return {"estilos": estilos}

@app.get("/salud")
async def verificar_salud():
    return {
        "estado": "activo",
        "servicio": "ai",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "estadisticas": {
            "perfiles_activos": len(perfiles_usuarios),
            "productos_en_db": len(productos_db),
            "algoritmos_disponibles": ["recomendacion_personalizada", "analisis_tendencias", "compatibilidad_estilo"]
        }
    }

if __name__ == "__main__":
    puerto = int(os.getenv("PUERTO", 3007))
    print(f"🚀 AI Service v2.0 iniciando en puerto {puerto}")
    uvicorn.run(
        "main-completo:app",
        host="0.0.0.0",
        port=puerto,
        reload=os.getenv("ENTORNO") == "desarrollo"
    )